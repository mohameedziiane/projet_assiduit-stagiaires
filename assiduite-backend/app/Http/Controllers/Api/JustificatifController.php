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

            $justificatifs = Justificatif::with(['absence.stagiaire.groupe', 'absence.seance.personnel.user'])
                ->whereHas('absence', function ($query) use ($stagiaire) {
                    $query->where('stagiaire_id', $stagiaire->id);
                })
                ->get();

            return response()->json(
                $justificatifs->map(fn (Justificatif $justificatif) => $this->serializeJustificatif($justificatif))
            );
        }

        $justificatifs = Justificatif::with(['absence.stagiaire.groupe', 'absence.seance.personnel.user'])->get();

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
            'fichier' => 'required|file|mimes:pdf,jpg,jpeg,png|max:2048'
        ]);

        $stagiaire = $this->resolveOwnedStagiaire($request);

        $absence = Absence::findOrFail($validated['absence_id']);

        if ($absence->stagiaire_id !== $stagiaire->id) {
            return response()->json([
                'message' => 'Vous ne pouvez deposer un justificatif que pour vos propres absences.'
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
            'date_depot' => now()
        ]);

        $absence->update([
            'statut' => 'en_attente'
        ]);

        return response()->json(
            $this->serializeJustificatif(
                $justificatif->fresh(['absence.stagiaire.groupe', 'absence.seance.personnel.user'])
            ),
            201
        );
    }

    public function valider(Request $request, $id)
    {
        $validated = $request->validate([
            'statut' => 'required|in:valide,refuse',
            'motif_refus' => 'required_if:statut,refuse|nullable|string'
        ]);

        $justificatif = Justificatif::with(['absence.stagiaire.groupe', 'absence.seance.personnel.user'])->findOrFail($id);

        $justificatif->update([
            'statut' => $validated['statut'],
            'motif_refus' => $validated['statut'] === 'refuse'
                ? ($validated['motif_refus'] ?? null)
                : null
        ]);

        if ($justificatif->absence) {
            $justificatif->absence->update([
                'statut' => $validated['statut'] === 'valide' ? 'justifiee' : 'non_justifiee'
            ]);

            if ($validated['statut'] === 'refuse') {
                $this->notificationService->notifyJustificatifRefused($justificatif);
                $this->notificationService->notifyAbsenceThresholdExceeded($justificatif->absence->stagiaire);
            }
        }

        return response()->json([
            'message' => 'Justificatif traite avec succes',
            'justificatif' => $this->serializeJustificatif(
                $justificatif->fresh(['absence.stagiaire.groupe', 'absence.seance.personnel.user'])
            )
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

        return [
            'id' => $justificatif->id,
            'absence_id' => $justificatif->absence_id,
            'fichier' => $justificatif->fichier,
            'type_fichier' => $justificatif->type_fichier,
            'statut' => $justificatif->statut,
            'motif_refus' => $justificatif->motif_refus,
            'date_depot' => $justificatif->date_depot,
            'absence' => $absence ? [
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
}
