<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Seance;
use Illuminate\Http\Request;

class SeanceController extends Controller
{
    public function index()
    {
        $seances = Seance::with(['groupe', 'personnel'])->get();
        return response()->json($seances);
    }

    public function stagiairesForSeance($id)
    {
        $seance = Seance::with('groupe.stagiaires.user')->findOrFail($id);

        return response()->json(
            $seance->groupe?->stagiaires
                ? $seance->groupe->stagiaires->map(function ($stagiaire) use ($seance) {
                    return [
                        'id' => $stagiaire->id,
                        'user_id' => $stagiaire->user_id,
                        'groupe_id' => $stagiaire->groupe_id,
                        'nom' => $stagiaire->nom,
                        'prenom' => $stagiaire->prenom,
                        'nom_complet' => trim($stagiaire->prenom . ' ' . $stagiaire->nom),
                        'matricule' => $stagiaire->matricule,
                        'numero_stagiaire' => $stagiaire->numero_stagiaire,
                        'email' => $stagiaire->user?->email,
                        'groupe' => [
                            'id' => $seance->groupe->id,
                            'nom' => $seance->groupe->nom,
                            'filiere' => $seance->groupe->filiere,
                        ],
                    ];
                })->values()
                : []
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'groupe_id' => 'required|exists:groupes,id',
            'personnel_id' => 'required|exists:personnels,id',
            'module' => 'required|string',
            'date_seance' => 'required|date',
            'heure_debut' => 'required',
            'heure_fin' => 'required',
            'salle' => 'nullable|string'
        ]);

        $seance = Seance::create($validated);

        return response()->json($seance, 201);
    }

    public function update(Request $request, $id)
    {
        $seance = Seance::findOrFail($id);

        $validated = $request->validate([
            'groupe_id' => 'required|exists:groupes,id',
            'personnel_id' => 'required|exists:personnels,id',
            'module' => 'required|string',
            'date_seance' => 'required|date',
            'heure_debut' => 'required',
            'heure_fin' => 'required',
            'salle' => 'nullable|string'
        ]);

        $seance->update($validated);

        return response()->json($seance);
    }

    public function destroy($id)
    {
        $seance = Seance::findOrFail($id);
        $seance->delete();

        return response()->json([
            'message' => 'Seance deleted successfully'
        ]);
    }
}
