<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        $stagiaireRole = Role::where('nom', 'stagiaire')->first();

        if (!$stagiaireRole) {
            return response()->json([
                'message' => 'Le role stagiaire est introuvable.'
            ], 500);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $stagiaireRole->id,
        ]);

        $user->load(['role', 'stagiaire.groupe', 'personnel']);

        $token = $user->createToken('token')->plainTextToken;

        return response()->json([
            'user' => $this->serializeAuthenticatedUser($user),
            'token' => $token
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $user = User::with(['role', 'stagiaire.groupe', 'personnel'])
            ->where('email', $request->email)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        $token = $user->createToken('token')->plainTextToken;

        return response()->json([
            'user' => $this->serializeAuthenticatedUser($user),
            'token' => $token
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load(['role', 'stagiaire.groupe', 'personnel']);

        return response()->json($this->serializeAuthenticatedUser($user));
    }

    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user()->load(['role', 'stagiaire.groupe', 'personnel']);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Le mot de passe actuel est incorrect.'
            ], 422);
        }

        $user->forceFill([
            'password' => Hash::make($validated['new_password']),
            'must_change_password' => false,
        ])->save();

        return response()->json([
            'message' => 'Mot de passe mis a jour avec succes.',
            'user' => $this->serializeAuthenticatedUser($user->fresh(['role', 'stagiaire.groupe', 'personnel'])),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout successful'
        ]);
    }

    private function serializeAuthenticatedUser(User $user): array
    {
        $stagiaire = $user->stagiaire;
        $groupe = $stagiaire?->groupe;
        $personnel = $user->personnel;

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'must_change_password' => (bool) $user->must_change_password,
            'role' => $user->role ? [
                'id' => $user->role->id,
                'nom' => $user->role->nom,
                'description' => $user->role->description,
            ] : null,
            'stagiaire_id' => $stagiaire?->id,
            'groupe_id' => $groupe?->id,
            'stagiaire' => $stagiaire ? [
                'id' => $stagiaire->id,
                'user_id' => $stagiaire->user_id,
                'groupe_id' => $stagiaire->groupe_id,
                'numero_stagiaire' => $stagiaire->numero_stagiaire,
                'nom' => $stagiaire->nom,
                'prenom' => $stagiaire->prenom,
                'cin' => $stagiaire->cin,
                'date_naissance' => $stagiaire->date_naissance,
                'genre' => $stagiaire->genre,
                'niveau_scolaire' => $stagiaire->niveau_scolaire,
                'annee_bac' => $stagiaire->annee_bac,
                'moyenne_bac' => $stagiaire->moyenne_bac,
                'telephone' => $stagiaire->telephone,
                'photo' => $stagiaire->photo,
                'matricule' => $stagiaire->matricule,
                'note_assiduite' => $stagiaire->note_assiduite,
            ] : null,
            'groupe' => $groupe ? [
                'id' => $groupe->id,
                'nom' => $groupe->nom,
                'filiere' => $groupe->filiere,
                'code_filiere' => $groupe->code_filiere,
                'type_formation' => $groupe->type_formation,
                'motif_admission' => $groupe->motif_admission,
                'niveau' => $groupe->niveau,
                'annee_scolaire' => $groupe->annee_scolaire,
                'annee_formation' => $groupe->annee_formation,
            ] : null,
            'personnel' => $personnel ? [
                'id' => $personnel->id,
                'user_id' => $personnel->user_id,
                'nom' => $personnel->nom,
                'prenom' => $personnel->prenom,
                'telephone' => $personnel->telephone,
                'matricule' => $personnel->matricule,
                'fonction' => $personnel->fonction,
            ] : null,
        ];
    }
}
