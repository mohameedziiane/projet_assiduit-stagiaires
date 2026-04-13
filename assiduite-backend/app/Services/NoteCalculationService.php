<?php

namespace App\Services;

use App\Models\Absence;
use App\Models\Note;
use App\Models\Stagiaire;

class NoteCalculationService
{
    public function calculateForStagiaire(Stagiaire $stagiaire): Note
    {
        $noteAssiduite = (float) ($stagiaire->note_assiduite ?? 0);

        $nonJustifieeCount = Absence::where('stagiaire_id', $stagiaire->id)
            ->where('statut', 'non_justifiee')
            ->count();

        $noteDiscipline = ($nonJustifieeCount * 3) + ($noteAssiduite * 2);

        return Note::updateOrCreate(
            [
                'stagiaire_id' => $stagiaire->id,
                'date_calcul' => now()->toDateString(),
            ],
            [
                'note_assiduite' => $noteAssiduite,
                'note_discipline' => $noteDiscipline,
                'annee_formation' => $stagiaire->groupe?->annee_formation,
            ]
        );
    }
}
