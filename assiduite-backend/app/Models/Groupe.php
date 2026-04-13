<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Groupe extends Model
{
    protected $fillable = [
        'nom',
        'filiere',
        'code_filiere',
        'type_formation',
        'motif_admission',
        'niveau',
        'annee_scolaire',
        'annee_formation',
    ];

    public function stagiaires()
    {
        return $this->hasMany(Stagiaire::class);
    }

    public function seances()
    {
        return $this->hasMany(Seance::class);
    }
}
