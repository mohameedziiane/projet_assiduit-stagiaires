<?php

namespace App\Models;

use Laravel\Sanctum\HasApiTokens;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'must_change_password',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'must_change_password' => 'boolean',
        ];
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function personnel()
    {
        return $this->hasOne(Personnel::class);
    }

    public function stagiaire()
    {
        return $this->hasOne(Stagiaire::class);
    }

    public function submittedAdministrativePasswordResetRequests()
    {
        return $this->hasMany(AdministrativePasswordResetRequest::class, 'requester_user_id');
    }

    public function targetedAdministrativePasswordResetRequests()
    {
        return $this->hasMany(AdministrativePasswordResetRequest::class, 'target_user_id');
    }

    public function processedAdministrativePasswordResetRequests()
    {
        return $this->hasMany(AdministrativePasswordResetRequest::class, 'processed_by_user_id');
    }
}
