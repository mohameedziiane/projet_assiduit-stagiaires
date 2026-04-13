<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Note extends Model
{
    protected $fillable = [
        'stagiaire_id',
        'note_assiduite',
        'note_discipline',
        'date_calcul',
        'annee_formation',
    ];

    public function stagiaire()
    {
        return $this->belongsTo(Stagiaire::class);
    }
}
