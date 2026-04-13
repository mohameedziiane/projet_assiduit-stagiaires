<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Absence extends Model
{
    protected $fillable = [
        'stagiaire_id',
        'seance_id',
        'type_absence',
        'statut',
        'commentaire',
        'duree_minutes'
    ];

    protected $with = [
        'justificatif',
    ];

    public function stagiaire()
    {
        return $this->belongsTo(Stagiaire::class);
    }

    public function seance()
    {
        return $this->belongsTo(Seance::class);
    }

    public function justificatif()
    {
        return $this->hasOne(Justificatif::class);
    }

    public function billets()
    {
        return $this->hasMany(Billet::class);
    }
}
