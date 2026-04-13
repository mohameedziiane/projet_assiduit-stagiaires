<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Stagiaire extends Model
{
    protected $fillable = [
        'user_id',
        'groupe_id',
        'numero_stagiaire',
        'nom',
        'prenom',
        'cin',
        'date_naissance',
        'genre',
        'niveau_scolaire',
        'niveau',
        'code_filiere',
        'filiere',
        'type_formation',
        'annee_etude',
        'annee_bac',
        'moyenne_bac',
        'nationalite',
        'date_inscription',
        'date_dossier_complet',
        'motif_admission',
        'statut',
        'telephone',
        'photo',
        'matricule',
        'note_assiduite'
    ];

    protected $casts = [
        'date_naissance' => 'date',
        'date_inscription' => 'date',
        'date_dossier_complet' => 'date',
        'moyenne_bac' => 'decimal:2',
        'note_assiduite' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function groupe()
    {
        return $this->belongsTo(Groupe::class);
    }

    public function absences()
    {
        return $this->hasMany(Absence::class);
    }

    public function billets()
    {
        return $this->hasMany(Billet::class);
    }

    public function notes()
    {
        return $this->hasMany(Note::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }
}
