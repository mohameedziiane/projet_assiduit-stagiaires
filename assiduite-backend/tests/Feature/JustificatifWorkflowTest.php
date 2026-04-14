<?php

namespace Tests\Feature;

use App\Models\Absence;
use App\Models\Billet;
use App\Models\Groupe;
use App\Models\Personnel;
use App\Models\Role;
use App\Models\Seance;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class JustificatifWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_stagiaire_can_upload_own_justificatif_and_absence_becomes_pending(): void
    {
        Storage::fake('public');

        [$stagiaireUser, $stagiaire] = $this->createStagiaireUser();
        $absence = $this->createAbsenceForStagiaire($stagiaire);

        Sanctum::actingAs($stagiaireUser);

        $response = $this->post('/api/justificatifs', [
            'absence_id' => $absence->id,
            'fichier' => UploadedFile::fake()->create('justificatif.pdf', 200, 'application/pdf'),
        ]);

        $response->assertCreated()
            ->assertJsonPath('statut', 'en_attente')
            ->assertJsonPath('absence.workflow_status', 'justificatif_en_attente');

        $this->assertDatabaseHas('justificatifs', [
            'absence_id' => $absence->id,
            'statut' => 'en_attente',
            'reviewed_by' => null,
        ]);

        $this->assertDatabaseHas('absences', [
            'id' => $absence->id,
            'statut' => 'en_attente',
        ]);
    }

    public function test_gestionnaire_can_accept_justificatif_and_absence_becomes_justified(): void
    {
        [$stagiaireUser, $stagiaire] = $this->createStagiaireUser();
        [$gestionnaireUser] = $this->createGestionnaireUser();
        $absence = $this->createAbsenceForStagiaire($stagiaire, ['statut' => 'en_attente']);
        $justificatif = $absence->justificatif()->create([
            'fichier' => 'justificatifs/test.pdf',
            'type_fichier' => 'pdf',
            'statut' => 'en_attente',
            'date_depot' => now(),
        ]);

        Sanctum::actingAs($gestionnaireUser);

        $response = $this->putJson("/api/justificatifs/{$justificatif->id}/accepter");

        $response->assertOk()
            ->assertJsonPath('justificatif.statut', 'accepte')
            ->assertJsonPath('justificatif.absence.statut', 'justifiee')
            ->assertJsonPath('justificatif.absence.billet_status', 'en_attente_creation_billet');

        $this->assertDatabaseHas('justificatifs', [
            'id' => $justificatif->id,
            'statut' => 'accepte',
            'reviewed_by' => $gestionnaireUser->id,
        ]);

        $this->assertDatabaseHas('absences', [
            'id' => $absence->id,
            'statut' => 'justifiee',
        ]);
    }

    public function test_gestionnaire_must_provide_reason_when_rejecting_justificatif(): void
    {
        [$stagiaireUser, $stagiaire] = $this->createStagiaireUser();
        [$gestionnaireUser] = $this->createGestionnaireUser();
        $absence = $this->createAbsenceForStagiaire($stagiaire, ['statut' => 'en_attente']);
        $justificatif = $absence->justificatif()->create([
            'fichier' => 'justificatifs/test.pdf',
            'type_fichier' => 'pdf',
            'statut' => 'en_attente',
            'date_depot' => now(),
        ]);

        Sanctum::actingAs($gestionnaireUser);

        $missingReasonResponse = $this->putJson("/api/justificatifs/{$justificatif->id}/refuser");
        $missingReasonResponse->assertStatus(422);

        $response = $this->putJson("/api/justificatifs/{$justificatif->id}/refuser", [
            'motif_refus' => 'Document incomplet.',
        ]);

        $response->assertOk()
            ->assertJsonPath('justificatif.statut', 'refuse')
            ->assertJsonPath('justificatif.motif_refus', 'Document incomplet.')
            ->assertJsonPath('justificatif.absence.workflow_status', 'justificatif_refuse');

        $this->assertDatabaseHas('justificatifs', [
            'id' => $justificatif->id,
            'statut' => 'refuse',
            'motif_refus' => 'Document incomplet.',
            'reviewed_by' => $gestionnaireUser->id,
        ]);

        $this->assertDatabaseHas('absences', [
            'id' => $absence->id,
            'statut' => 'non_justifiee',
        ]);
    }

    public function test_gestionnaire_can_create_billet_only_after_accepted_justificatif(): void
    {
        [$stagiaireUser, $stagiaire] = $this->createStagiaireUser();
        [$gestionnaireUser, $gestionnairePersonnel] = $this->createGestionnaireUser();
        $absence = $this->createAbsenceForStagiaire($stagiaire, ['statut' => 'en_attente']);
        $justificatif = $absence->justificatif()->create([
            'fichier' => 'justificatifs/test.pdf',
            'type_fichier' => 'pdf',
            'statut' => 'en_attente',
            'date_depot' => now(),
        ]);

        Sanctum::actingAs($gestionnaireUser);

        $blockedResponse = $this->postJson('/api/billets', [
            'stagiaire_id' => $stagiaire->id,
            'absence_id' => $absence->id,
            'justificatif_id' => $justificatif->id,
            'personnel_id' => $gestionnairePersonnel->id,
            'type' => 'absence',
            'date_validite' => now()->addDay()->toDateString(),
        ]);

        $blockedResponse->assertStatus(422);

        $justificatif->update(['statut' => 'accepte']);
        $absence->update(['statut' => 'justifiee']);

        $createdResponse = $this->postJson('/api/billets', [
            'stagiaire_id' => $stagiaire->id,
            'absence_id' => $absence->id,
            'justificatif_id' => $justificatif->id,
            'personnel_id' => $gestionnairePersonnel->id,
            'type' => 'absence',
            'motif' => 'Regularisation validee.',
            'date_validite' => now()->addDay()->toDateString(),
            'statut' => 'actif',
        ]);

        $createdResponse->assertCreated()
            ->assertJsonPath('absence_id', $absence->id)
            ->assertJsonPath('justificatif_id', $justificatif->id)
            ->assertJsonPath('statut', 'actif');

        $this->assertDatabaseHas('billets', [
            'absence_id' => $absence->id,
            'justificatif_id' => $justificatif->id,
            'created_by' => $gestionnaireUser->id,
            'statut' => 'actif',
        ]);
    }

    private function createStagiaireUser(): array
    {
        $role = Role::firstOrCreate(['nom' => 'stagiaire'], ['description' => '']);
        $user = User::factory()->create(['role_id' => $role->id]);
        $groupe = Groupe::create([
            'nom' => 'DEV-TEST',
            'filiere' => 'Dev',
            'niveau' => 'TS',
            'annee_scolaire' => '2025-2026',
        ]);

        $stagiaire = Stagiaire::create([
            'user_id' => $user->id,
            'groupe_id' => $groupe->id,
            'nom' => 'Test',
            'prenom' => 'Stagiaire',
            'matricule' => 'MAT-001',
        ]);

        return [$user, $stagiaire];
    }

    private function createGestionnaireUser(): array
    {
        $role = Role::firstOrCreate(['nom' => 'gestionnaire'], ['description' => '']);
        $user = User::factory()->create(['role_id' => $role->id]);

        $personnel = Personnel::create([
            'user_id' => $user->id,
            'nom' => 'Gestionnaire',
            'prenom' => 'Test',
            'fonction' => 'gestionnaire',
        ]);

        return [$user, $personnel];
    }

    private function createAbsenceForStagiaire(Stagiaire $stagiaire, array $overrides = []): Absence
    {
        $formateurRole = Role::firstOrCreate(['nom' => 'formateur'], ['description' => '']);
        $formateurUser = User::factory()->create(['role_id' => $formateurRole->id]);
        $personnel = Personnel::create([
            'user_id' => $formateurUser->id,
            'nom' => 'Formateur',
            'prenom' => 'Test',
            'fonction' => 'formateur',
        ]);

        $seance = Seance::create([
            'groupe_id' => $stagiaire->groupe_id,
            'personnel_id' => $personnel->id,
            'module' => 'API Laravel',
            'date_seance' => '2026-04-14',
            'heure_debut' => '08:00:00',
            'heure_fin' => '10:00:00',
            'salle' => 'B1',
        ]);

        return Absence::create(array_merge([
            'stagiaire_id' => $stagiaire->id,
            'seance_id' => $seance->id,
            'type_absence' => 'absence',
            'statut' => 'non_justifiee',
            'duree_minutes' => 120,
        ], $overrides));
    }
}
