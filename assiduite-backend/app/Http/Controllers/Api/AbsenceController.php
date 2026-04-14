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
        $absences = Absence::with([
                'stagiaire.groupe',
                'seance.personnel.user',
                'justificatif.reviewedBy.personnel',
                'billets',
            ])
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

        $absences = Absence::with([
                'stagiaire.groupe',
                'seance.personnel.user',
                'justificatif.reviewedBy.personnel',
                'billets',
            ])
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
            'duree_minutes' => 'nullable|integer|min:0',
        ]);

        $this->ensureStagiaireMatchesSeance($validated['stagiaire_id'], $validated['seance_id']);

        if (!isset($validated['statut'])) {
            $validated['statut'] = 'non_justifiee';
        }

        $absence = Absence::create($validated);
        $absence->load([
            'stagiaire.groupe',
            'seance.personnel.user',
            'justificatif.reviewedBy.personnel',
            'billets',
        ]);
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
            'duree_minutes' => 'nullable|integer|min:0',
        ]);

        $this->ensureStagiaireMatchesSeance($validated['stagiaire_id'], $validated['seance_id']);

        $absence->update($validated);
        $absence->load([
            'stagiaire.groupe',
            'seance.personnel.user',
            'justificatif.reviewedBy.personnel',
            'billets',
        ]);
        $this->notificationService->notifyAbsenceThresholdExceeded($absence->stagiaire);

        return response()->json($this->serializeAbsence($absence));
    }

    public function destroy($id)
    {
        $absence = Absence::findOrFail($id);
        $absence->delete();

        return response()->json([
            'message' => 'Absence deleted successfully',
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
        $justificatif = $absence->justificatif;
        $workflow = $this->buildAbsenceWorkflow($absence);

        return [
            'id' => $absence->id,
            'stagiaire_id' => $absence->stagiaire_id,
            'seance_id' => $absence->seance_id,
            'statut' => $absence->statut,
            'status_label' => $workflow['absence_status_label'],
            'workflow_status' => $workflow['workflow_status'],
            'workflow_label' => $workflow['workflow_label'],
            'billet_status' => $workflow['billet_status'],
            'billet_label' => $workflow['billet_label'],
            'billets' => $absence->relationLoaded('billets')
                ? $absence->billets->map(fn ($billet) => [
                    'id' => $billet->id,
                    'code_unique' => $billet->code_unique,
                    'type' => $billet->type,
                    'statut' => $billet->statut ?? ($billet->est_actif ? 'actif' : 'expire'),
                    'date_validite' => optional($billet->date_validite)->toISOString(),
                ])->values()->all()
                : [],
            'can_upload_justificatif' => $justificatif === null,
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
            'justificatif' => $justificatif ? [
                'id' => $justificatif->id,
                'absence_id' => $justificatif->absence_id,
                'fichier' => $justificatif->fichier,
                'fichier_url' => $justificatif->fichier_url,
                'type_fichier' => $justificatif->type_fichier,
                'statut' => $justificatif->normalized_statut,
                'status_label' => $this->getJustificatifStatusLabel($justificatif->normalized_statut),
                'motif_refus' => $justificatif->motif_refus,
                'date_depot' => optional($justificatif->date_depot)->toISOString(),
                'reviewed_at' => optional($justificatif->reviewed_at)->toISOString(),
                'reviewed_by' => $justificatif->reviewedBy ? [
                    'id' => $justificatif->reviewedBy->id,
                    'name' => $justificatif->reviewedBy->name,
                    'personnel' => $justificatif->reviewedBy->personnel ? [
                        'id' => $justificatif->reviewedBy->personnel->id,
                        'nom' => $justificatif->reviewedBy->personnel->nom,
                        'prenom' => $justificatif->reviewedBy->personnel->prenom,
                        'fonction' => $justificatif->reviewedBy->personnel->fonction,
                    ] : null,
                ] : null,
            ] : null,
        ];
    }

    private function buildAbsenceWorkflow(Absence $absence): array
    {
        $justificatif = $absence->justificatif;
        $normalizedJustificatifStatus = $justificatif?->normalized_statut;
        $hasBillet = $absence->relationLoaded('billets')
            ? $absence->billets->isNotEmpty()
            : $absence->billets()->exists();

        if (!$justificatif) {
            return [
                'absence_status_label' => $absence->statut === 'justifiee' ? 'Justifiee' : 'Non justifiee',
                'workflow_status' => 'no_justificatif',
                'workflow_label' => 'Aucun justificatif depose',
                'billet_status' => null,
                'billet_label' => null,
            ];
        }

        if ($normalizedJustificatifStatus === 'en_attente') {
            return [
                'absence_status_label' => 'Justificatif en attente',
                'workflow_status' => 'justificatif_en_attente',
                'workflow_label' => 'En cours de traitement',
                'billet_status' => null,
                'billet_label' => null,
            ];
        }

        if ($normalizedJustificatifStatus === 'refuse') {
            return [
                'absence_status_label' => 'Justificatif refuse',
                'workflow_status' => 'justificatif_refuse',
                'workflow_label' => 'Justificatif refuse',
                'billet_status' => null,
                'billet_label' => null,
            ];
        }

        return [
            'absence_status_label' => 'Justificatif accepte',
            'workflow_status' => $hasBillet ? 'justificatif_accepte' : 'en_attente_creation_billet',
            'workflow_label' => 'Justificatif accepte',
            'billet_status' => $hasBillet ? 'billet_cree' : 'en_attente_creation_billet',
            'billet_label' => $hasBillet ? 'Billet cree' : 'En attente de creation du billet',
        ];
    }

    private function getJustificatifStatusLabel(string $status): string
    {
        return match ($status) {
            'en_attente' => 'En attente',
            'accepte' => 'Accepte',
            'refuse' => 'Refuse',
            default => 'Inconnu',
        };
    }
}
