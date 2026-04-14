<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Justificatif extends Model
{
    protected $fillable = [
        'absence_id',
        'fichier',
        'type_fichier',
        'statut',
        'motif_refus',
        'reviewed_by',
        'reviewed_at',
        'date_depot'
    ];

    protected $casts = [
        'date_depot' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    public function absence()
    {
        return $this->belongsTo(Absence::class);
    }

    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function getNormalizedStatutAttribute(): string
    {
        return $this->statut === 'valide' ? 'accepte' : $this->statut;
    }

    public function getFichierUrlAttribute(): ?string
    {
        if (!$this->fichier) {
            return null;
        }

        return Storage::disk('public')->url($this->fichier);
    }
}
