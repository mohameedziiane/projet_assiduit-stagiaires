<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absence;
use App\Models\Seance;
use App\Models\Stagiaire;
use App\Services\StagiaireNotificationService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AbsenceController extends Controller
{
    public function __construct(private StagiaireNotificationService $notificationService)
    {
    }

    public function index()
    {
        $absences = Absence::with(['stagiaire.groupe', 'seance.personnel.user', 'justificatif'])
            ->get()
            ->map(fn (Absence $absence) => $this->serializeAbsence($absence));

        return response()->json($absences);
    }

    public function indexForAuthenticatedStagiaire(Request $request)
    {
        $stagiaire = $request->user()->stagiaire;

        if (!$stagiaire) {
            abort(403, 'Aucun profil stagiaire associe a cet utilisateur.');
        }

        $absences = Absence::with(['stagiaire.groupe', 'seance.personnel.user', 'justificatif'])
            ->where('stagiaire_id', $stagiaire->id)
            ->latest('id')
            ->get()
            ->map(fn (Absence $absence) => $this->serializeAbsence($absence));

        return response()->json($absences);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'seance_id' => 'required|exists:seances,id',
            'stagiaire_id' => [
                'required',
                'exists:stagiaires,id',
                Rule::unique('absences')->where(function ($query) use ($request) {
                    return $query->where('seance_id', $request->input('seance_id'));
                }),
            ],
            'type_absence' => 'nullable|string|max:255',
            'statut' => 'nullable|in:justifiee,non_justifiee,en_attente',
            'commentaire' => 'nullable|string',
            'duree_minutes' => 'nullable|integer|min:0'
        ]);

        $this->ensureStagiaireMatchesSeance($validated['stagiaire_id'], $validated['seance_id']);

        if (!isset($validated['statut'])) {
            $validated['statut'] = 'non_justifiee';
        }

        $absence = Absence::create($validated);
        $absence->load(['stagiaire.groupe', 'seance.personnel.user', 'justificatif']);
        $this->notificationService->notifyAbsenceThresholdExceeded($absence->stagiaire);

        return response()->json($this->serializeAbsence($absence), 201);
    }

    public function update(Request $request, $id)
    {
        $absence = Absence::findOrFail($id);

        $validated = $request->validate([
            'seance_id' => 'required|exists:seances,id',
            'stagiaire_id' => [
                'required',
                'exists:stagiaires,id',
                Rule::unique('absences')->ignore($absence->id)->where(function ($query) use ($request) {
                    return $query->where('seance_id', $request->input('seance_id'));
                }),
            ],
            'type_absence' => 'nullable|string|max:255',
            'statut' => 'required|in:justifiee,non_justifiee,en_attente',
            'commentaire' => 'nullable|string',
            'duree_minutes' => 'nullable|integer|min:0'
        ]);

        $this->ensureStagiaireMatchesSeance($validated['stagiaire_id'], $validated['seance_id']);

        $absence->update($validated);
        $absence->load(['stagiaire.groupe', 'seance.personnel.user', 'justificatif']);
        $this->notificationService->notifyAbsenceThresholdExceeded($absence->stagiaire);

        return response()->json($this->serializeAbsence($absence));
    }

    public function destroy($id)
    {
        $absence = Absence::findOrFail($id);
        $absence->delete();

        return response()->json([
            'message' => 'Absence deleted successfully'
        ]);
    }

    private function ensureStagiaireMatchesSeance(int $stagiaireId, int $seanceId): void
    {
        $stagiaire = Stagiaire::findOrFail($stagiaireId);
        $seance = Seance::findOrFail($seanceId);

        if ($stagiaire->groupe_id !== $seance->groupe_id) {
            abort(422, 'Le stagiaire ne correspond pas au groupe de la seance.');
        }
    }

    private function serializeAbsence(Absence $absence): array
    {
        $seance = $absence->seance;
        $personnel = $seance?->personnel;
        $stagiaire = $absence->stagiaire;

        return [
            'id' => $absence->id,
            'stagiaire_id' => $absence->stagiaire_id,
            'seance_id' => $absence->seance_id,
            'statut' => $absence->statut,
            'type_absence' => $absence->type_absence,
            'commentaire' => $absence->commentaire,
            'duree_minutes' => $absence->duree_minutes,
            'stagiaire' => $stagiaire ? [
                'id' => $stagiaire->id,
                'nom' => $stagiaire->nom,
                'prenom' => $stagiaire->prenom,
                'matricule' => $stagiaire->matricule,
                'groupe' => $stagiaire->groupe ? [
                    'id' => $stagiaire->groupe->id,
                    'nom' => $stagiaire->groupe->nom,
                    'filiere' => $stagiaire->groupe->filiere,
                ] : null,
            ] : null,
            'seance' => $seance ? [
                'id' => $seance->id,
                'groupe_id' => $seance->groupe_id,
                'personnel_id' => $seance->personnel_id,
                'module' => $seance->module,
                'date_seance' => $seance->date_seance,
                'heure_debut' => $seance->heure_debut,
                'heure_fin' => $seance->heure_fin,
                'salle' => $seance->salle,
                'formateur' => $personnel ? [
                    'id' => $personnel->id,
                    'nom' => $personnel->nom,
                    'prenom' => $personnel->prenom,
                    'nom_complet' => trim($personnel->prenom . ' ' . $personnel->nom),
                    'email' => $personnel->user?->email,
                    'fonction' => $personnel->fonction,
                ] : null,
            ] : null,
            'justificatif' => $absence->justificatif ? [
                'id' => $absence->justificatif->id,
                'absence_id' => $absence->justificatif->absence_id,
                'fichier' => $absence->justificatif->fichier,
                'type_fichier' => $absence->justificatif->type_fichier,
                'statut' => $absence->justificatif->statut,
                'motif_refus' => $absence->justificatif->motif_refus,
                'date_depot' => $absence->justificatif->date_depot,
            ] : null,
        ];
    }
}
