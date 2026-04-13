<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\GroupeController;
use App\Http\Controllers\Api\StagiaireController;
use App\Http\Controllers\Api\PersonnelController;
use App\Http\Controllers\Api\SeanceController;
use App\Http\Controllers\Api\AbsenceController;
use App\Http\Controllers\Api\JustificatifController;
use App\Http\Controllers\Api\BilletController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\NoteController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\AdministrativePasswordResetRequestController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/password-reset-requests', [AdministrativePasswordResetRequestController::class, 'store']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/password-reset-requests/assigned', [AdministrativePasswordResetRequestController::class, 'assigned']);
    Route::post('/password-reset-requests/{id}/approve', [AdministrativePasswordResetRequestController::class, 'approve']);
    Route::post('/password-reset-requests/{id}/reject', [AdministrativePasswordResetRequestController::class, 'reject']);

    Route::middleware('role:formateur')->group(function () {
        Route::get('/seances', [SeanceController::class, 'index']);
        Route::get('/formateur/seances/{id}/stagiaires', [SeanceController::class, 'stagiairesForSeance']);
        Route::post('/seances', [SeanceController::class, 'store']);
        Route::put('/seances/{id}', [SeanceController::class, 'update']);
        Route::delete('/seances/{id}', [SeanceController::class, 'destroy']);

        Route::post('/absences', [AbsenceController::class, 'store']);
        Route::put('/absences/{id}', [AbsenceController::class, 'update']);
        Route::delete('/absences/{id}', [AbsenceController::class, 'destroy']);

        Route::get('/billets/verifier', [BilletController::class, 'verifierAutorisation']);
        Route::get('/billets/{id}/verifier', [BilletController::class, 'verifierAutorisation']);
    });

    Route::middleware('role:gestionnaire')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::put('/users/{user}/role', [UserController::class, 'updateRole']);

        Route::get('/groupes', [GroupeController::class, 'index']);
        Route::post('/groupes', [GroupeController::class, 'store']);
        Route::put('/groupes/{id}', [GroupeController::class, 'update']);
        Route::delete('/groupes/{id}', [GroupeController::class, 'destroy']);

        Route::get('/stagiaires', [StagiaireController::class, 'index']);
        Route::post('/stagiaires/manual', [StagiaireController::class, 'storeManual']);
        Route::post('/stagiaires/import', [StagiaireController::class, 'import']);
        Route::post('/stagiaires', [StagiaireController::class, 'store']);
        Route::put('/stagiaires/{id}', [StagiaireController::class, 'update']);
        Route::delete('/stagiaires/{id}', [StagiaireController::class, 'destroy']);

        Route::get('/personnels', [PersonnelController::class, 'index']);
        Route::post('/personnels', [PersonnelController::class, 'store']);
        Route::put('/personnels/{id}', [PersonnelController::class, 'update']);
        Route::delete('/personnels/{id}', [PersonnelController::class, 'destroy']);

        Route::put('/justificatifs/{id}/valider', [JustificatifController::class, 'valider']);
        Route::post('/notes/calculate/{stagiaire_id}', [NoteController::class, 'calculate']);

        Route::get('/billets', [BilletController::class, 'index']);
        Route::post('/billets', [BilletController::class, 'store']);
        Route::get('/billets/{id}', [BilletController::class, 'show']);
        Route::put('/billets/{id}', [BilletController::class, 'update']);
        Route::delete('/billets/{id}', [BilletController::class, 'destroy']);
    });

    Route::middleware('role:directeur')->group(function () {
        Route::get('/stats/globales', [StatsController::class, 'globales']);
    });

    Route::middleware('role:formateur,gestionnaire')->group(function () {
        Route::get('/absences', [AbsenceController::class, 'index']);
    });

    Route::middleware('role:gestionnaire,directeur')->group(function () {
        Route::get('/stats/groupes', [StatsController::class, 'groupes']);
        Route::get('/stats/stagiaires', [StatsController::class, 'stagiaires']);
    });

    Route::middleware('role:stagiaire,gestionnaire')->group(function () {
        Route::get('/justificatifs', [JustificatifController::class, 'index']);
    });

    Route::middleware('role:stagiaire')->group(function () {
        Route::post('/justificatifs', [JustificatifController::class, 'store']);
        Route::get('/stagiaire/absences', [AbsenceController::class, 'indexForAuthenticatedStagiaire']);
        Route::get('/stagiaire/notifications', [NotificationController::class, 'indexForAuthenticatedStagiaire']);
        Route::patch('/stagiaire/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::get('/stagiaire/stats', [StatsController::class, 'forAuthenticatedStagiaire']);
        Route::get('/stats/stagiaire/{id}', [StatsController::class, 'stagiaire']);
    });
});
