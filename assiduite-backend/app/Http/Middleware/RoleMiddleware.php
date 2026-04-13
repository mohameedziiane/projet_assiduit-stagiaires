<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user || !$user->role) {
            return response()->json([
                'message' => 'Utilisateur non authentifié ou rôle introuvable'
            ], 401);
        }

        if (!in_array($user->role->nom, $roles)) {
            return response()->json([
                'message' => 'Accès refusé'
            ], 403);
        }

        return $next($request);
    }
}