<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function indexForAuthenticatedStagiaire(Request $request)
    {
        $stagiaire = $request->user()->stagiaire;

        if (!$stagiaire) {
            abort(403, 'Aucun profil stagiaire associe a cet utilisateur.');
        }

        return response()->json(
            Notification::where('stagiaire_id', $stagiaire->id)
                ->latest('date_envoi')
                ->get()
        );
    }

    public function markAsRead(Request $request, int $notification)
    {
        $stagiaire = $request->user()->stagiaire;

        if (!$stagiaire) {
            abort(403, 'Aucun profil stagiaire associe a cet utilisateur.');
        }

        $notification = Notification::where('stagiaire_id', $stagiaire->id)
            ->findOrFail($notification);

        $notification->update([
            'vu' => true,
        ]);

        return response()->json([
            'message' => 'Notification marquee comme lue.',
            'notification' => $notification->fresh(),
        ]);
    }
}
