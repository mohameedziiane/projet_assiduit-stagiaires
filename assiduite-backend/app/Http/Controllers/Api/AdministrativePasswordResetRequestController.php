<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdministrativePasswordResetRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdministrativePasswordResetRequestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $currentUser = $request->user();

        if ($currentUser) {
            $currentUser->load('role');

            if (!$currentUser->role) {
                return response()->json([
                    'message' => 'Role utilisateur introuvable.'
                ], 422);
            }

            $existingPendingRequest = $this->findPendingRequestForTargetUser($currentUser->id);

            if ($existingPendingRequest) {
                return response()->json([
                    'message' => 'Une demande en attente existe deja pour ce compte.',
                    'request' => $this->serializeRequest($existingPendingRequest),
                ], 409);
            }

            if (!$this->canRoleSubmitForgotPasswordRequest($currentUser->role->nom)) {
                return response()->json([
                    'message' => 'Ce role ne peut pas soumettre de demande de reinitialisation.'
                ], 403);
            }

            $resetRequest = AdministrativePasswordResetRequest::create([
                'requester_user_id' => $currentUser->id,
                'target_user_id' => $currentUser->id,
                'target_role_id' => $currentUser->role_id,
                'status' => AdministrativePasswordResetRequest::STATUS_PENDING,
            ]);

            $resetRequest->load(['requester.role', 'targetUser.role', 'targetRole', 'processor.role']);

            return response()->json([
                'message' => 'Demande de reinitialisation envoyee avec succes.',
                'request' => $this->serializeRequest($resetRequest),
            ], 201);
        }

        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $targetUser = User::query()
            ->with('role')
            ->where('email', $validated['email'])
            ->first();

        if (!$targetUser || !$targetUser->role) {
            return response()->json([
                'message' => 'Aucun compte correspondant n a ete trouve.'
            ], 404);
        }

        if (!$this->canRoleSubmitForgotPasswordRequest($targetUser->role->nom)) {
            return response()->json([
                'message' => 'Ce role ne peut pas soumettre de demande de reinitialisation via cette page.'
            ], 403);
        }

        $existingPendingRequest = $this->findPendingRequestForTargetUser($targetUser->id);

        if ($existingPendingRequest) {
            return response()->json([
                'message' => 'Une demande en attente existe deja pour ce compte.',
                'request' => $this->serializeRequest($existingPendingRequest),
            ], 409);
        }

        $resetRequest = AdministrativePasswordResetRequest::create([
            'requester_user_id' => $targetUser->id,
            'target_user_id' => $targetUser->id,
            'target_role_id' => $targetUser->role_id,
            'status' => AdministrativePasswordResetRequest::STATUS_PENDING,
        ]);

        $resetRequest->load(['requester.role', 'targetUser.role', 'targetRole', 'processor.role']);

        return response()->json([
            'message' => 'Demande de reinitialisation envoyee avec succes.',
            'request' => $this->serializeRequest($resetRequest),
        ], 201);
    }

    public function assigned(Request $request): JsonResponse
    {
        $currentUser = $request->user()->load('role');
        $allowedTargetRoles = $this->getProcessableRoleNames($currentUser);

        if (empty($allowedTargetRoles)) {
            return response()->json([
                'message' => 'Aucune demande ne peut etre traitee par ce role.'
            ], 403);
        }

        $requests = AdministrativePasswordResetRequest::query()
            ->with(['requester.role', 'targetUser.role', 'targetRole', 'processor.role'])
            ->where('status', AdministrativePasswordResetRequest::STATUS_PENDING)
            ->whereHas('targetRole', function ($query) use ($allowedTargetRoles) {
                $query->whereIn('nom', $allowedTargetRoles);
            })
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (AdministrativePasswordResetRequest $resetRequest) => $this->serializeRequest($resetRequest))
            ->values();

        return response()->json([
            'message' => 'Demandes assignees recuperees avec succes.',
            'data' => $requests,
        ]);
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user()->load('role');
        $resetRequest = AdministrativePasswordResetRequest::query()
            ->with(['requester.role', 'targetUser.role', 'targetRole', 'processor.role'])
            ->findOrFail($id);

        $authorizationError = $this->validateProcessAuthorization($currentUser, $resetRequest);

        if ($authorizationError) {
            return $authorizationError;
        }

        $targetUser = $resetRequest->targetUser;

        if (!$targetUser) {
            return response()->json([
                'message' => 'Le compte cible de cette demande est introuvable.'
            ], 422);
        }

        $defaultPassword = $this->resolveDefaultPassword();

        if ($defaultPassword === null) {
            return response()->json([
                'message' => 'Le mot de passe par defaut n est pas configure.'
            ], 500);
        }

        DB::transaction(function () use ($targetUser, $resetRequest, $currentUser, $defaultPassword) {
            $targetUser->forceFill([
                'password' => Hash::make($defaultPassword),
                'must_change_password' => true,
            ])->save();

            $targetUser->tokens()->delete();

            $resetRequest->forceFill([
                'status' => AdministrativePasswordResetRequest::STATUS_APPROVED,
                'processed_by_user_id' => $currentUser->id,
                'processed_at' => now(),
                'refusal_reason' => null,
            ])->save();
        });

        $resetRequest->refresh()->load(['requester.role', 'targetUser.role', 'targetRole', 'processor.role']);

        return response()->json([
            'message' => 'La demande a ete approuvee et le mot de passe a ete reinitialise.',
            'request' => $this->serializeRequest($resetRequest),
        ]);
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'refusal_reason' => ['required', 'string', 'max:2000'],
        ]);

        $currentUser = $request->user()->load('role');
        $resetRequest = AdministrativePasswordResetRequest::query()
            ->with(['requester.role', 'targetUser.role', 'targetRole', 'processor.role'])
            ->findOrFail($id);

        $authorizationError = $this->validateProcessAuthorization($currentUser, $resetRequest);

        if ($authorizationError) {
            return $authorizationError;
        }

        $refusalReason = trim($validated['refusal_reason']);

        if ($refusalReason === '') {
            return response()->json([
                'message' => 'Le motif du refus est obligatoire.'
            ], 422);
        }

        $resetRequest->forceFill([
            'status' => AdministrativePasswordResetRequest::STATUS_REJECTED,
            'processed_by_user_id' => $currentUser->id,
            'processed_at' => now(),
            'refusal_reason' => $refusalReason,
        ])->save();

        $resetRequest->refresh()->load(['requester.role', 'targetUser.role', 'targetRole', 'processor.role']);

        return response()->json([
            'message' => 'La demande a ete rejetee.',
            'request' => $this->serializeRequest($resetRequest),
        ]);
    }

    private function validateProcessAuthorization(
        User $currentUser,
        AdministrativePasswordResetRequest $resetRequest
    ): ?JsonResponse {
        if (!$currentUser->role) {
            return response()->json([
                'message' => 'Role utilisateur introuvable.'
            ], 422);
        }

        if ($resetRequest->status !== AdministrativePasswordResetRequest::STATUS_PENDING) {
            return response()->json([
                'message' => 'Cette demande a deja ete traitee.'
            ], 409);
        }

        if (
            $resetRequest->requester_user_id === $currentUser->id ||
            $resetRequest->target_user_id === $currentUser->id
        ) {
            return response()->json([
                'message' => 'Vous ne pouvez pas traiter votre propre demande.'
            ], 403);
        }

        $targetRoleName = $resetRequest->targetRole?->nom
            ?? $resetRequest->targetUser?->role?->nom;

        if (!$targetRoleName) {
            return response()->json([
                'message' => 'Le role cible de cette demande est introuvable.'
            ], 422);
        }

        if (!$this->canProcessRole($currentUser, $targetRoleName)) {
            return response()->json([
                'message' => 'Vous n etes pas autorise a traiter cette demande.'
            ], 403);
        }

        return null;
    }

    private function canRoleSubmitForgotPasswordRequest(string $roleName): bool
    {
        return in_array($roleName, [
            Role::ROLE_STAGIAIRE,
            Role::ROLE_FORMATEUR,
            Role::ROLE_GESTIONNAIRE,
            Role::ROLE_DIRECTEUR,
        ], true);
    }

    private function canProcessRole(User $currentUser, string $targetRoleName): bool
    {
        return in_array($targetRoleName, $this->getProcessableRoleNames($currentUser), true);
    }

    private function getProcessableRoleNames(User $currentUser): array
    {
        $roleName = $currentUser->role?->nom;

        return match ($roleName) {
            Role::ROLE_GESTIONNAIRE => [Role::ROLE_STAGIAIRE],
            Role::ROLE_DIRECTEUR => [Role::ROLE_FORMATEUR, Role::ROLE_GESTIONNAIRE],
            Role::ROLE_ADMIN => [Role::ROLE_DIRECTEUR],
            default => [],
        };
    }

    private function serializeRequest(AdministrativePasswordResetRequest $resetRequest): array
    {
        $resetRequest->loadMissing(['requester.role', 'targetUser.role', 'targetRole', 'processor.role']);

        return [
            'id' => $resetRequest->id,
            'status' => $resetRequest->status,
            'requester' => $resetRequest->requester ? [
                'id' => $resetRequest->requester->id,
                'name' => $resetRequest->requester->name,
                'email' => $resetRequest->requester->email,
                'role' => $resetRequest->requester->role?->nom,
            ] : null,
            'target_user' => $resetRequest->targetUser ? [
                'id' => $resetRequest->targetUser->id,
                'name' => $resetRequest->targetUser->name,
                'email' => $resetRequest->targetUser->email,
                'role' => $resetRequest->targetUser->role?->nom,
                'must_change_password' => (bool) $resetRequest->targetUser->must_change_password,
            ] : null,
            'target_role' => $resetRequest->targetRole?->nom,
            'processor' => $resetRequest->processor ? [
                'id' => $resetRequest->processor->id,
                'name' => $resetRequest->processor->name,
                'email' => $resetRequest->processor->email,
                'role' => $resetRequest->processor->role?->nom,
            ] : null,
            'processed_at' => optional($resetRequest->processed_at)->toISOString(),
            'refusal_reason' => $resetRequest->refusal_reason,
            'created_at' => optional($resetRequest->created_at)->toISOString(),
            'updated_at' => optional($resetRequest->updated_at)->toISOString(),
        ];
    }

    private function resolveDefaultPassword(): ?string
    {
        $value = trim((string) config('services.administrative_password_reset.default_password'));

        return $value !== '' ? $value : null;
    }

    private function findPendingRequestForTargetUser(int $targetUserId): ?AdministrativePasswordResetRequest
    {
        return AdministrativePasswordResetRequest::query()
            ->where('target_user_id', $targetUserId)
            ->where('status', AdministrativePasswordResetRequest::STATUS_PENDING)
            ->first();
    }
}
