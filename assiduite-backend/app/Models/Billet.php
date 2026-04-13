<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Billet extends Model
{
    protected $fillable = [
        'stagiaire_id',
        'absence_id',
        'personnel_id',
        'type',
        'code_unique',
        'qr_code',
        'motif',
        'date_validite',
        'duree_retard_minutes',
        'est_actif'
    ];

    public function stagiaire()
    {
        return $this->belongsTo(Stagiaire::class);
    }

    public function absence()
    {
        return $this->belongsTo(Absence::class);
    }

    public function personnel()
    {
        return $this->belongsTo(Personnel::class);
    }
}
