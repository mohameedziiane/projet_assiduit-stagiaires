<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Personnel;
use Illuminate\Http\Request;

class PersonnelController extends Controller
{
    public function index()
    {
        $personnels = Personnel::with('user')->get();

        return response()->json($personnels);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id|unique:personnels,user_id',
            'nom' => 'required|string',
            'prenom' => 'required|string',
            'telephone' => 'nullable|string',
            'matricule' => 'required|string|unique:personnels,matricule',
            'fonction' => 'required|string'
        ]);

        $personnel = Personnel::create($validated);

        return response()->json($personnel, 201);
    }

    public function update(Request $request, $id)
    {
        $personnel = Personnel::findOrFail($id);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id|unique:personnels,user_id,' . $personnel->id,
            'nom' => 'required|string',
            'prenom' => 'required|string',
            'telephone' => 'nullable|string',
            'matricule' => 'required|string|unique:personnels,matricule,' . $personnel->id,
            'fonction' => 'required|string'
        ]);

        $personnel->update($validated);

        return response()->json($personnel);
    }

    public function destroy($id)
    {
        $personnel = Personnel::findOrFail($id);
        $personnel->delete();

        return response()->json([
            'message' => 'Personnel deleted successfully'
        ]);
    }
}