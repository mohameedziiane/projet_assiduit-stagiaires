<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    public const ROLE_STAGIAIRE = 'stagiaire';
    public const ROLE_FORMATEUR = 'formateur';
    public const ROLE_GESTIONNAIRE = 'gestionnaire';
    public const ROLE_DIRECTEUR = 'directeur';
    public const ROLE_ADMIN = 'admin';

    protected $fillable = ['nom', 'description'];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function administrativePasswordResetRequests()
    {
        return $this->hasMany(AdministrativePasswordResetRequest::class, 'target_role_id');
    }
}
