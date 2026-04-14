<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Billet extends Model
{
    protected $fillable = [
        'stagiaire_id',
        'absence_id',
        'justificatif_id',
        'personnel_id',
        'created_by',
        'type',
        'code_unique',
        'qr_code',
        'motif',
        'date_validite',
        'heure_debut',
        'heure_fin',
        'statut',
        'duree_retard_minutes',
        'est_actif'
    ];

    protected $casts = [
        'date_validite' => 'datetime',
        'est_actif' => 'boolean',
    ];

    public function stagiaire()
    {
        return $this->belongsTo(Stagiaire::class);
    }

    public function absence()
    {
        return $this->belongsTo(Absence::class);
    }

    public function justificatif()
    {
        return $this->belongsTo(Justificatif::class);
    }

    public function personnel()
    {
        return $this->belongsTo(Personnel::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
