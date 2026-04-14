<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absence;
use App\Models\Billet;
use App\Models\Justificatif;
use App\Models\Seance;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class BilletController extends Controller
{
    public function index(Request $request)
    {
        $billets = Billet::with($this->defaultRelations());

        if ($request->user()->role->nom === 'stagiaire') {
            $stagiaire = $request->user()->stagiaire;

            if (!$stagiaire) {
                abort(403, 'Aucun profil stagiaire associe a cet utilisateur.');
            }

            $billets->where('stagiaire_id', $stagiaire->id);
        }

        return response()->json(
            $billets->latest('id')->get()->map(fn (Billet $billet) => $this->serializeBillet($billet))
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'stagiaire_id' => 'required|exists:stagiaires,id',
            'absence_id' => 'required|exists:absences,id',
            'justificatif_id' => 'nullable|exists:justificatifs,id',
            'personnel_id' => 'required|exists:personnels,id',
            'type' => ['required', Rule::in(['absence', 'retard', 'entree'])],
            'qr_code' => 'nullable|string|max:255',
            'motif' => 'nullable|string',
            'date_validite' => 'required|date',
            'heure_debut' => 'nullable|date_format:H:i',
            'heure_fin' => 'nullable|date_format:H:i|after:heure_debut',
            'statut' => ['nullable', Rule::in(['actif', 'expire', 'utilise', 'annule'])],
            'duree_retard_minutes' => 'nullable|integer|min:0',
        ]);

        $absence = $this->resolveLinkedAbsence(
            (int) $validated['absence_id'],
            (int) $validated['stagiaire_id']
        );

        $justificatif = $this->resolveEligibleJustificatif(
            $absence,
            isset($validated['justificatif_id']) ? (int) $validated['justificatif_id'] : null
        );

        if ($absence->billets()->exists()) {
            return response()->json([
                'message' => 'Un billet existe deja pour cette absence.',
            ], 422);
        }

        $billet = Billet::create([
            'stagiaire_id' => $validated['stagiaire_id'],
            'absence_id' => $absence->id,
            'justificatif_id' => $justificatif->id,
            'personnel_id' => $validated['personnel_id'],
            'created_by' => $request->user()->id,
            'type' => $validated['type'],
            'code_unique' => $this->generateUniqueCode(),
            'qr_code' => $validated['qr_code'] ?? null,
            'motif' => $validated['motif'] ?? null,
            'date_validite' => $validated['date_validite'],
            'heure_debut' => $validated['heure_debut'] ?? null,
            'heure_fin' => $validated['heure_fin'] ?? null,
            'statut' => $validated['statut'] ?? 'actif',
            'duree_retard_minutes' => $validated['duree_retard_minutes'] ?? null,
            'est_actif' => ($validated['statut'] ?? 'actif') === 'actif',
        ]);

        return response()->json($this->serializeBillet($billet->fresh($this->defaultRelations())), 201);
    }

    public function show(Request $request, $id)
    {
        $billet = Billet::with($this->defaultRelations())->findOrFail($id);

        if ($request->user()->role->nom === 'stagiaire') {
            $stagiaire = $request->user()->stagiaire;

            if (!$stagiaire || $billet->stagiaire_id !== $stagiaire->id) {
                return response()->json([
                    'message' => 'Acces refuse a ce billet.',
                ], 403);
            }
        }

        return response()->json($this->serializeBillet($billet));
    }

    public function update(Request $request, $id)
    {
        $billet = Billet::with($this->defaultRelations())->findOrFail($id);

        $validated = $request->validate([
            'stagiaire_id' => 'required|exists:stagiaires,id',
            'absence_id' => 'required|exists:absences,id',
            'justificatif_id' => 'nullable|exists:justificatifs,id',
            'personnel_id' => 'required|exists:personnels,id',
            'type' => ['required', Rule::in(['absence', 'retard', 'entree'])],
            'qr_code' => 'nullable|string|max:255',
            'motif' => 'nullable|string',
            'date_validite' => 'required|date',
            'heure_debut' => 'nullable|date_format:H:i',
            'heure_fin' => 'nullable|date_format:H:i|after:heure_debut',
            'statut' => ['required', Rule::in(['actif', 'expire', 'utilise', 'annule'])],
            'duree_retard_minutes' => 'nullable|integer|min:0',
            'est_actif' => 'sometimes|boolean',
        ]);

        $absence = $this->resolveLinkedAbsence(
            (int) $validated['absence_id'],
            (int) $validated['stagiaire_id']
        );

        $justificatif = $this->resolveEligibleJustificatif(
            $absence,
            isset($validated['justificatif_id']) ? (int) $validated['justificatif_id'] : null
        );

        $anotherBilletExists = Billet::where('absence_id', $absence->id)
            ->where('id', '!=', $billet->id)
            ->exists();

        if ($anotherBilletExists) {
            return response()->json([
                'message' => 'Un billet existe deja pour cette absence.',
            ], 422);
        }

        $billet->update([
            'stagiaire_id' => $validated['stagiaire_id'],
            'absence_id' => $absence->id,
            'justificatif_id' => $justificatif->id,
            'personnel_id' => $validated['personnel_id'],
            'type' => $validated['type'],
            'qr_code' => $validated['qr_code'] ?? $billet->qr_code,
            'motif' => $validated['motif'] ?? null,
            'date_validite' => $validated['date_validite'],
            'heure_debut' => $validated['heure_debut'] ?? null,
            'heure_fin' => $validated['heure_fin'] ?? null,
            'statut' => $validated['statut'],
            'duree_retard_minutes' => $validated['duree_retard_minutes'] ?? null,
            'est_actif' => $validated['est_actif'] ?? ($validated['statut'] === 'actif'),
        ]);

        return response()->json($this->serializeBillet($billet->fresh($this->defaultRelations())));
    }

    public function destroy($id)
    {
        $billet = Billet::findOrFail($id);
        $billet->delete();

        return response()->json(['message' => 'Billet deleted']);
    }

    public function verifierAutorisation(Request $request, $id = null)
    {
        if ($id !== null) {
            $billet = Billet::with(['stagiaire', 'absence.seance', 'personnel'])->findOrFail($id);

            return response()->json($this->buildAuthorizationResponse($billet, 'billet_id'));
        }

        $validated = $request->validate([
            'code_unique' => 'nullable|string',
            'stagiaire_id' => 'required_without:code_unique|exists:stagiaires,id',
            'seance_id' => 'required_without:code_unique|exists:seances,id',
        ]);

        $billetQuery = Billet::with(['stagiaire', 'absence.seance', 'personnel'])
            ->where('est_actif', true);

        if (!empty($validated['code_unique'])) {
            $billet = $billetQuery
                ->where('code_unique', strtoupper($validated['code_unique']))
                ->latest('date_validite')
                ->first();

            if (!$billet) {
                return response()->json([
                    'autorise' => false,
                    'message' => 'Aucun billet correspondant.'
                ], 404);
            }

            return response()->json($this->buildAuthorizationResponse($billet, 'code_unique'));
        }

        $seanceId = (int) $validated['seance_id'];
        $seanceDate = Seance::query()
            ->whereKey($seanceId)
            ->value('date_seance');

        $billet = $billetQuery
            ->where('stagiaire_id', $validated['stagiaire_id'])
            ->where(function ($query) use ($seanceId, $seanceDate) {
                $query->whereHas('absence', function ($absenceQuery) use ($seanceId) {
                    $absenceQuery->where('seance_id', $seanceId);
                });

                if ($seanceDate) {
                    $query->orWhereDate('date_validite', $seanceDate);
                }
            })
            ->latest('date_validite')
            ->first();

        if (!$billet) {
            return response()->json([
                'autorise' => false,
                'message' => 'Aucun billet actif pour ce stagiaire et cette seance.'
            ], 404);
        }

        $response = $this->buildAuthorizationResponse($billet, 'stagiaire_et_seance');
        $response['seance_id'] = $seanceId;

        return response()->json($response);
    }

    private function resolveLinkedAbsence(int $absenceId, int $stagiaireId): Absence
    {
        $absence = Absence::with(['justificatif', 'billets'])->findOrFail($absenceId);

        if ($absence->stagiaire_id !== $stagiaireId) {
            abort(422, 'L\'absence selectionnee n\'appartient pas a ce stagiaire.');
        }

        return $absence;
    }

    private function resolveEligibleJustificatif(Absence $absence, ?int $justificatifId = null): Justificatif
    {
        $justificatif = $absence->justificatif;

        if (!$justificatif) {
            abort(422, 'Aucun justificatif n\'est lie a cette absence.');
        }

        if ($justificatifId !== null && $justificatif->id !== $justificatifId) {
            abort(422, 'Le justificatif selectionne ne correspond pas a cette absence.');
        }

        if ($justificatif->normalized_statut !== 'accepte') {
            abort(422, 'Le billet ne peut etre cree qu\'apres acceptation du justificatif.');
        }

        return $justificatif;
    }

    private function buildAuthorizationResponse(Billet $billet, string $matchedBy): array
    {
        $now = Carbon::now();
        $dateValidite = Carbon::parse($billet->date_validite)->endOfDay();
        $autorise = $billet->est_actif && $dateValidite->greaterThanOrEqualTo($now);

        return [
            'billet_id' => $billet->id,
            'matched_by' => $matchedBy,
            'code_unique' => $billet->code_unique,
            'stagiaire_id' => $billet->stagiaire_id,
            'absence_id' => $billet->absence_id,
            'type' => $billet->type,
            'date_validite' => $billet->date_validite,
            'est_actif' => $billet->est_actif,
            'autorise' => $autorise,
            'message' => $autorise ? 'Billet autorise' : 'Billet non autorise'
        ];
    }

    private function serializeBillet(Billet $billet): array
    {
        return [
            'id' => $billet->id,
            'stagiaire_id' => $billet->stagiaire_id,
            'absence_id' => $billet->absence_id,
            'justificatif_id' => $billet->justificatif_id,
            'personnel_id' => $billet->personnel_id,
            'created_by' => $billet->created_by,
            'type' => $billet->type,
            'motif' => $billet->motif,
            'date_validite' => optional($billet->date_validite)->toISOString(),
            'heure_debut' => $billet->heure_debut,
            'heure_fin' => $billet->heure_fin,
            'statut' => $billet->statut ?? ($billet->est_actif ? 'actif' : 'expire'),
            'code_unique' => $billet->code_unique,
            'qr_code' => $billet->qr_code,
            'duree_retard_minutes' => $billet->duree_retard_minutes,
            'est_actif' => (bool) $billet->est_actif,
            'created_at' => optional($billet->created_at)->toISOString(),
            'stagiaire' => $billet->stagiaire ? [
                'id' => $billet->stagiaire->id,
                'nom' => $billet->stagiaire->nom,
                'prenom' => $billet->stagiaire->prenom,
                'matricule' => $billet->stagiaire->matricule,
            ] : null,
            'absence' => $billet->absence ? [
                'id' => $billet->absence->id,
                'type_absence' => $billet->absence->type_absence,
                'statut' => $billet->absence->statut,
                'seance' => $billet->absence->seance ? [
                    'id' => $billet->absence->seance->id,
                    'module' => $billet->absence->seance->module,
                    'date_seance' => $billet->absence->seance->date_seance,
                    'heure_debut' => $billet->absence->seance->heure_debut,
                    'heure_fin' => $billet->absence->seance->heure_fin,
                    'salle' => $billet->absence->seance->salle,
                ] : null,
            ] : null,
            'justificatif' => $billet->justificatif ? [
                'id' => $billet->justificatif->id,
                'statut' => $billet->justificatif->normalized_statut,
            ] : null,
            'personnel' => $billet->personnel ? [
                'id' => $billet->personnel->id,
                'nom' => $billet->personnel->nom,
                'prenom' => $billet->personnel->prenom,
                'fonction' => $billet->personnel->fonction,
            ] : null,
        ];
    }

    private function generateUniqueCode(): string
    {
        do {
            $code = 'BLT-' . strtoupper(Str::random(8));
        } while (Billet::where('code_unique', $code)->exists());

        return $code;
    }

    private function defaultRelations(): array
    {
        return [
            'stagiaire',
            'absence.seance',
            'justificatif',
            'personnel',
            'createdBy',
        ];
    }
}
