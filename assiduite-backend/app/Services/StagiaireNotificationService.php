<?php

namespace App\Services;

use App\Models\Justificatif;
use App\Models\Notification;
use App\Models\Stagiaire;

class StagiaireNotificationService
{
    private const ABSENCE_THRESHOLD = 3;

    public function notifyJustificatifRefused(Justificatif $justificatif): ?Notification
    {
        $absence = $justificatif->absence;

        if (!$absence || !$absence->stagiaire_id) {
            return null;
        }

        $message = 'Votre justificatif pour l\'absence #' . $absence->id . ' a ete refuse.';

        if ($justificatif->motif_refus) {
            $message .= ' Motif: ' . $justificatif->motif_refus;
        }

        return Notification::create([
            'stagiaire_id' => $absence->stagiaire_id,
            'type_notif' => 'justificatif_refuse',
            'message' => $message,
            'date_envoi' => now(),
            'vu' => false,
        ]);
    }

    public function notifyAbsenceThresholdExceeded(Stagiaire $stagiaire, ?int $threshold = null): ?Notification
    {
        $threshold = $threshold ?? self::ABSENCE_THRESHOLD;

        $count = $stagiaire->absences()
            ->where('statut', 'non_justifiee')
            ->count();

        if ($count < $threshold) {
            return null;
        }

        $message = "Vous avez {$count} absence(s) non justifiee(s). Le seuil de {$threshold} a ete atteint.";

        $existingNotification = Notification::where('stagiaire_id', $stagiaire->id)
            ->where('type_notif', 'seuil_absences_depasse')
            ->where('message', $message)
            ->first();

        if ($existingNotification) {
            return $existingNotification;
        }

        return Notification::create([
            'stagiaire_id' => $stagiaire->id,
            'type_notif' => 'seuil_absences_depasse',
            'message' => $message,
            'date_envoi' => now(),
            'vu' => false,
        ]);
    }
}
