<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'stagiaire_id',
        'type_notif',
        'message',
        'date_envoi',
        'vu',
    ];

    public function stagiaire()
    {
        return $this->belongsTo(Stagiaire::class);
    }
}
