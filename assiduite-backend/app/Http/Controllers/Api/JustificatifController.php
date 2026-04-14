<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absence;
use App\Models\Justificatif;
use App\Services\StagiaireNotificationService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class JustificatifController extends Controller
{
    public function __construct(private StagiaireNotificationService $notificationService)
    {
    }

    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role->nom === 'stagiaire') {
            $stagiaire = $this->resolveOwnedStagiaire($request);

            $justificatifs = Justificatif::with($this->defaultRelations())
                ->whereHas('absence', function ($query) use ($stagiaire) {
                    $query->where('stagiaire_id', $stagiaire->id);
                })
                ->latest('date_depot')
                ->get();

            return response()->json(
                $justificatifs->map(fn (Justificatif $justificatif) => $this->serializeJustificatif($justificatif))
            );
        }

        $justificatifs = Justificatif::with($this->defaultRelations())
            ->latest('date_depot')
            ->get();

        return response()->json(
            $justificatifs->map(fn (Justificatif $justificatif) => $this->serializeJustificatif($justificatif))
        );
    }

    public function pending()
    {
        $justificatifs = Justificatif::with($this->defaultRelations())
            ->where('statut', 'en_attente')
            ->latest('date_depot')
            ->get();

        return response()->json(
            $justificatifs->map(fn (Justificatif $justificatif) => $this->serializeJustificatif($justificatif))
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'absence_id' => [
                'required',
                'exists:absences,id',
                Rule::unique('justificatifs', 'absence_id'),
            ],
            'fichier' => 'required|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        $stagiaire = $this->resolveOwnedStagiaire($request);
        $absence = Absence::with(['justificatif', 'billets'])->findOrFail($validated['absence_id']);

        if ($absence->stagiaire_id !== $stagiaire->id) {
            return response()->json([
                'message' => 'Vous ne pouvez deposer un justificatif que pour vos propres absences.',
            ], 403);
        }

        $path = $request->file('fichier')->store('justificatifs', 'public');
        $type = $request->file('fichier')->getClientOriginalExtension();

        $justificatif = Justificatif::create([
            'absence_id' => $absence->id,
            'fichier' => $path,
            'type_fichier' => $type,
            'statut' => 'en_attente',
            'motif_refus' => null,
            'reviewed_by' => null,
            'reviewed_at' => null,
            'date_depot' => now(),
        ]);

        $absence->update([
            'statut' => 'en_attente',
        ]);

        return response()->json(
            $this->serializeJustificatif($justificatif->fresh($this->defaultRelations())),
            201
        );
    }

    public function accepter(Request $request, $id)
    {
        return $this->review($request, (int) $id, 'accepte');
    }

    public function refuser(Request $request, $id)
    {
        return $this->review($request, (int) $id, 'refuse');
    }

    public function valider(Request $request, $id)
    {
        $validated = $request->validate([
            'statut' => 'required|in:accepte,valide,refuse',
            'motif_refus' => 'required_if:statut,refuse|nullable|string|max:1000',
        ]);

        $status = $validated['statut'] === 'valide' ? 'accepte' : $validated['statut'];

        return $this->review($request, (int) $id, $status, $validated['motif_refus'] ?? null);
    }

    private function review(Request $request, int $id, string $status, ?string $motifRefus = null)
    {
        $validated = $request->validate([
            'motif_refus' => $status === 'refuse'
                ? 'required|string|max:1000'
                : 'nullable|string|max:1000',
        ]);

        $justificatif = Justificatif::with($this->defaultRelations())->findOrFail($id);
        $rejectionReason = $status === 'refuse'
            ? ($motifRefus ?? $validated['motif_refus'])
            : null;

        $justificatif->update([
            'statut' => $status,
            'motif_refus' => $rejectionReason,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        if ($justificatif->absence) {
            $justificatif->absence->update([
                'statut' => $status === 'accepte' ? 'justifiee' : 'non_justifiee',
            ]);

            if ($status === 'refuse') {
                $this->notificationService->notifyJustificatifRefused($justificatif->fresh('absence.stagiaire'));
                $this->notificationService->notifyAbsenceThresholdExceeded($justificatif->absence->stagiaire);
            }
        }

        $freshJustificatif = $justificatif->fresh($this->defaultRelations());

        return response()->json([
            'message' => $status === 'accepte'
                ? 'Justificatif accepte avec succes.'
                : 'Justificatif refuse avec succes.',
            'justificatif' => $this->serializeJustificatif($freshJustificatif),
        ]);
    }

    private function resolveOwnedStagiaire(Request $request)
    {
        $stagiaire = $request->user()->stagiaire;

        if (!$stagiaire) {
            abort(403, 'Aucun profil stagiaire associe a cet utilisateur.');
        }

        return $stagiaire;
    }

    private function serializeJustificatif(Justificatif $justificatif): array
    {
        $absence = $justificatif->absence;
        $stagiaire = $absence?->stagiaire;
        $groupe = $stagiaire?->groupe;
        $seance = $absence?->seance;
        $personnel = $seance?->personnel;
        $reviewedBy = $justificatif->reviewedBy;
        $normalizedStatus = $justificatif->normalized_statut;
        $absenceWorkflow = $this->buildAbsenceWorkflow($absence);

        return [
            'id' => $justificatif->id,
            'absence_id' => $justificatif->absence_id,
            'fichier' => $justificatif->fichier,
            'fichier_url' => $justificatif->fichier_url,
            'type_fichier' => $justificatif->type_fichier,
            'statut' => $normalizedStatus,
            'status_label' => $this->getJustificatifStatusLabel($normalizedStatus),
            'motif_refus' => $justificatif->motif_refus,
            'date_depot' => optional($justificatif->date_depot)->toISOString(),
            'reviewed_at' => optional($justificatif->reviewed_at)->toISOString(),
            'reviewed_by' => $reviewedBy ? [
                'id' => $reviewedBy->id,
                'name' => $reviewedBy->name,
                'personnel' => $reviewedBy->personnel ? [
                    'id' => $reviewedBy->personnel->id,
                    'nom' => $reviewedBy->personnel->nom,
                    'prenom' => $reviewedBy->personnel->prenom,
                    'fonction' => $reviewedBy->personnel->fonction,
                ] : null,
            ] : null,
            'absence' => $absence ? [
                'id' => $absence->id,
                'stagiaire_id' => $absence->stagiaire_id,
                'seance_id' => $absence->seance_id,
                'statut' => $absence->statut,
                'status_label' => $absenceWorkflow['absence_status_label'],
                'workflow_status' => $absenceWorkflow['workflow_status'],
                'workflow_label' => $absenceWorkflow['workflow_label'],
                'billet_status' => $absenceWorkflow['billet_status'],
                'billet_label' => $absenceWorkflow['billet_label'],
                'billets' => $absence->relationLoaded('billets')
                    ? $absence->billets->map(fn ($billet) => [
                        'id' => $billet->id,
                        'code_unique' => $billet->code_unique,
                        'type' => $billet->type,
                        'statut' => $billet->statut ?? ($billet->est_actif ? 'actif' : 'expire'),
                        'date_validite' => optional($billet->date_validite)->toISOString(),
                    ])->values()->all()
                    : [],
                'type_absence' => $absence->type_absence,
                'commentaire' => $absence->commentaire,
                'duree_minutes' => $absence->duree_minutes,
                'stagiaire' => $stagiaire ? [
                    'id' => $stagiaire->id,
                    'nom' => $stagiaire->nom,
                    'prenom' => $stagiaire->prenom,
                    'matricule' => $stagiaire->matricule,
                    'groupe' => $groupe ? [
                        'id' => $groupe->id,
                        'nom' => $groupe->nom,
                        'filiere' => $groupe->filiere,
                    ] : null,
                ] : null,
                'seance' => $seance ? [
                    'id' => $seance->id,
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
            ] : null,
        ];
    }

    private function buildAbsenceWorkflow(?Absence $absence): array
    {
        if (!$absence) {
            return [
                'absence_status_label' => 'Inconnu',
                'workflow_status' => null,
                'workflow_label' => null,
                'billet_status' => null,
                'billet_label' => null,
            ];
        }

        $justificatif = $absence->justificatif;
        $normalizedStatus = $justificatif?->normalized_statut;
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

        if ($normalizedStatus === 'en_attente') {
            return [
                'absence_status_label' => 'Justificatif en attente',
                'workflow_status' => 'justificatif_en_attente',
                'workflow_label' => 'En cours de traitement',
                'billet_status' => null,
                'billet_label' => null,
            ];
        }

        if ($normalizedStatus === 'refuse') {
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

    private function defaultRelations(): array
    {
        return [
            'absence.justificatif.reviewedBy.personnel',
            'absence.stagiaire.groupe',
            'absence.seance.personnel.user',
            'absence.billets',
            'reviewedBy.personnel',
        ];
    }
}
