<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Stagiaire;
use App\Services\NoteCalculationService;

class NoteController extends Controller
{
    public function __construct(private NoteCalculationService $noteCalculationService)
    {
    }

    public function calculate(int $stagiaireId)
    {
        $stagiaire = Stagiaire::with('groupe')->findOrFail($stagiaireId);
        $note = $this->noteCalculationService->calculateForStagiaire($stagiaire);

        return response()->json([
            'message' => 'Note calculee avec succes.',
            'note' => $note->fresh('stagiaire'),
        ]);
    }
}
