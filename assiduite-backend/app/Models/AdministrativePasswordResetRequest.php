<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdministrativePasswordResetRequest extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'requester_user_id',
        'target_user_id',
        'target_role_id',
        'status',
        'processed_by_user_id',
        'processed_at',
        'refusal_reason',
    ];

    protected function casts(): array
    {
        return [
            'processed_at' => 'datetime',
        ];
    }

    public static function statuses(): array
    {
        return [
            self::STATUS_PENDING,
            self::STATUS_APPROVED,
            self::STATUS_REJECTED,
        ];
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_user_id');
    }

    public function targetUser()
    {
        return $this->belongsTo(User::class, 'target_user_id');
    }

    public function targetRole()
    {
        return $this->belongsTo(Role::class, 'target_role_id');
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by_user_id');
    }
}
