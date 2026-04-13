<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Groupe;
use Illuminate\Http\Request;

class GroupeController extends Controller
{
    // GET جميع groupes
    public function index()
    {
        return response()->json(Groupe::all());
    }

    // POST créer groupe
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|unique:groupes,nom',
            'filiere' => 'nullable|string',
            'code_filiere' => 'nullable|string|max:255',
            'type_formation' => 'nullable|string|max:255',
            'motif_admission' => 'nullable|string|max:255',
            'niveau' => 'nullable|string',
            'annee_scolaire' => 'nullable|string',
            'annee_formation' => 'nullable|string|max:255',
        ]);

        $groupe = Groupe::create($validated);

        return response()->json($groupe, 201);
    }

    // PUT modifier groupe
    public function update(Request $request, $id)
    {
        $groupe = Groupe::findOrFail($id);

        $validated = $request->validate([
            'nom' => 'required|string|unique:groupes,nom,' . $groupe->id,
            'filiere' => 'nullable|string',
            'code_filiere' => 'nullable|string|max:255',
            'type_formation' => 'nullable|string|max:255',
            'motif_admission' => 'nullable|string|max:255',
            'niveau' => 'nullable|string',
            'annee_scolaire' => 'nullable|string',
            'annee_formation' => 'nullable|string|max:255',
        ]);

        $groupe->update($validated);

        return response()->json($groupe);
    }

    // DELETE supprimer groupe
    public function destroy($id)
    {
        $groupe = Groupe::findOrFail($id);
        $groupe->delete();

        return response()->json([
            'message' => 'Groupe deleted successfully'
        ]);
    }
}
