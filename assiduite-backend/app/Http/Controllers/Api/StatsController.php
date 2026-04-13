<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absence;
use App\Models\Billet;
use App\Models\Groupe;
use App\Models\Justificatif;
use App\Models\Seance;
use App\Models\Stagiaire;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    public function globales()
    {
        $totalStagiaires = Stagiaire::count();
        $totalGroupes = Groupe::count();
        $totalSeances = Seance::count();
        $totalAbsences = Absence::count();

        $totalAbsencesJustifiees = Absence::where('statut', 'justifiee')->count();
        $totalAbsencesNonJustifiees = Absence::where('statut', 'non_justifiee')->count();

        $totalJustificatifs = Justificatif::count();
        $justificatifsEnAttente = Justificatif::where('statut', 'en_attente')->count();
        $justificatifsValides = Justificatif::where('statut', 'valide')->count();
        $justificatifsRefuses = Justificatif::where('statut', 'refuse')->count();

        $billetsActifs = Billet::where('est_actif', true)->count();

        return response()->json([
            'total_stagiaires' => $totalStagiaires,
            'total_groupes' => $totalGroupes,
            'total_seances' => $totalSeances,
            'total_absences' => $totalAbsences,
            'moyenne_absences_par_stagiaire' => $totalStagiaires > 0
                ? round($totalAbsences / $totalStagiaires, 2)
                : 0,
            'total_absences_justifiees' => $totalAbsencesJustifiees,
            'total_absences_non_justifiees' => $totalAbsencesNonJustifiees,
            'total_justificatifs' => $totalJustificatifs,
            'justificatifs_en_attente' => $justificatifsEnAttente,
            'justificatifs_valides' => $justificatifsValides,
            'justificatifs_refuses' => $justificatifsRefuses,
            'billets_actifs' => $billetsActifs,
        ]);
    }

    public function stagiaire(Request $request, $id)
    {
        $stagiaire = Stagiaire::with('groupe')->findOrFail($id);

        if ($request->user()->role->nom === 'stagiaire') {
            $ownedStagiaire = $request->user()->stagiaire;

            if (!$ownedStagiaire || $ownedStagiaire->id !== $stagiaire->id) {
                return response()->json([
                    'message' => 'Acces refuse a ces statistiques.'
                ], 403);
            }
        }

        return response()->json($this->buildDetailedStagiaireStats($stagiaire));
    }

    public function forAuthenticatedStagiaire(Request $request)
    {
        $stagiaire = $request->user()->stagiaire;

        if (!$stagiaire) {
            return response()->json([
                'message' => 'Aucun profil stagiaire associe a cet utilisateur.'
            ], 403);
        }

        return response()->json($this->buildAuthenticatedStagiaireStats($stagiaire));
    }

    public function stagiaires()
    {
        $stagiaires = Stagiaire::with('groupe')
            ->withCount([
                'absences as total_absences',
                'absences as absences_non_justifiees' => function ($query) {
                    $query->where('statut', 'non_justifiee');
                },
            ])
            ->get()
            ->map(function (Stagiaire $stagiaire) {
                $moyenneGroupe = Stagiaire::where('groupe_id', $stagiaire->groupe_id)
                    ->withCount('absences')
                    ->get()
                    ->avg('absences_count') ?? 0;

                return [
                    'id' => $stagiaire->id,
                    'nom' => $stagiaire->nom,
                    'prenom' => $stagiaire->prenom,
                    'groupe' => $stagiaire->groupe?->nom,
                    'total_absences' => $stagiaire->total_absences,
                    'absences_non_justifiees' => $stagiaire->absences_non_justifiees,
                    'ecart_vs_moyenne_groupe' => round($stagiaire->total_absences - $moyenneGroupe, 2),
                ];
            });

        return response()->json($stagiaires);
    }

    public function groupes()
    {
        $groupes = Groupe::withCount('stagiaires')
            ->get()
            ->map(function ($groupe) {
                $totalAbsences = Absence::whereHas('stagiaire', function ($query) use ($groupe) {
                    $query->where('groupe_id', $groupe->id);
                })->count();

                $absencesJustifiees = Absence::where('statut', 'justifiee')
                    ->whereHas('stagiaire', function ($query) use ($groupe) {
                        $query->where('groupe_id', $groupe->id);
                    })->count();

                $absencesNonJustifiees = Absence::where('statut', 'non_justifiee')
                    ->whereHas('stagiaire', function ($query) use ($groupe) {
                        $query->where('groupe_id', $groupe->id);
                    })->count();

                $moyenneAbsences = $groupe->stagiaires_count > 0
                    ? round($totalAbsences / $groupe->stagiaires_count, 2)
                    : 0;

                return [
                    'id' => $groupe->id,
                    'nom' => $groupe->nom,
                    'filiere' => $groupe->filiere,
                    'niveau' => $groupe->niveau,
                    'annee_scolaire' => $groupe->annee_scolaire,
                    'total_stagiaires' => $groupe->stagiaires_count,
                    'total_absences' => $totalAbsences,
                    'absences_justifiees' => $absencesJustifiees,
                    'absences_non_justifiees' => $absencesNonJustifiees,
                    'moyenne_absences_par_stagiaire' => $moyenneAbsences,
                    'comparaison_simple' => [
                        'vs_moyenne_globale' => round(
                            $moyenneAbsences - (
                                Stagiaire::count() > 0
                                    ? Absence::count() / Stagiaire::count()
                                    : 0
                            ),
                            2
                        ),
                    ],
                ];
            });

        return response()->json($groupes);
    }

    private function buildDetailedStagiaireStats(Stagiaire $stagiaire): array
    {
        $baseStats = $this->buildBaseStagiaireStats($stagiaire);

        $totalSeancesGroupe = Seance::where('groupe_id', $stagiaire->groupe_id)->count();

        $tauxAbsence = $totalSeancesGroupe > 0
            ? round(($baseStats['total_absences'] / $totalSeancesGroupe) * 100, 2)
            : 0;

        $moyenneGroupe = Stagiaire::where('groupe_id', $stagiaire->groupe_id)
            ->withCount('absences')
            ->get()
            ->avg('absences_count');

        return array_merge([
            'stagiaire' => [
                'id' => $stagiaire->id,
                'nom' => $stagiaire->nom,
                'prenom' => $stagiaire->prenom,
                'groupe' => $stagiaire->groupe ? $stagiaire->groupe->nom : null,
            ],
        ], $baseStats, [
            'absences_justifiees' => $baseStats['justified'],
            'absences_non_justifiees' => $baseStats['unjustified'],
            'taux_absence' => $tauxAbsence,
            'moyenne_absences_groupe' => round($moyenneGroupe ?? 0, 2),
            'comparaison_groupe' => [
                'ecart_absences_vs_moyenne' => round($baseStats['total_absences'] - ($moyenneGroupe ?? 0), 2),
                'au_dessus_de_la_moyenne' => $baseStats['total_absences'] > ($moyenneGroupe ?? 0),
            ],
        ]);
    }

    private function buildAuthenticatedStagiaireStats(Stagiaire $stagiaire): array
    {
        return $this->buildBaseStagiaireStats($stagiaire);
    }

    private function buildBaseStagiaireStats(Stagiaire $stagiaire): array
    {
        $totalAbsences = Absence::where('stagiaire_id', $stagiaire->id)->count();
        $justified = Absence::where('stagiaire_id', $stagiaire->id)
            ->where('statut', 'justifiee')
            ->count();
        $unjustified = Absence::where('stagiaire_id', $stagiaire->id)
            ->where('statut', 'non_justifiee')
            ->count();
        $pending = Absence::where('stagiaire_id', $stagiaire->id)
            ->where('statut', 'en_attente')
            ->count();
        $totalMinutes = (int) (Absence::where('stagiaire_id', $stagiaire->id)->sum('duree_minutes') ?? 0);

        $absencesParMois = Absence::join('seances', 'absences.seance_id', '=', 'seances.id')
            ->where('absences.stagiaire_id', $stagiaire->id)
            ->selectRaw('DATE_FORMAT(seances.date_seance, "%Y-%m") as mois, COUNT(absences.id) as total')
            ->groupBy('mois')
            ->orderBy('mois')
            ->get();

        return [
            'total_absences' => $totalAbsences,
            'justified' => $justified,
            'unjustified' => $unjustified,
            'pending' => $pending,
            'total_minutes' => $totalMinutes,
            'absences_par_mois' => $absencesParMois,
        ];
    }
}
