<?php

namespace Database\Seeders;

use App\Models\Absence;
use App\Models\Billet;
use App\Models\Groupe;
use App\Models\Justificatif;
use App\Models\Notification;
use App\Models\Personnel;
use App\Models\Role;
use App\Models\Seance;
use App\Models\Stagiaire;
use App\Models\User;
use App\Services\NoteCalculationService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoPresentationSeeder extends Seeder
{
    public function run(): void
    {
        $roles = $this->seedRoles();

        $gestionnaireUser = $this->upsertUser(
            'Demo Gestionnaire',
            'gestionnaire.demo@ofppt.local',
            $roles[Role::ROLE_GESTIONNAIRE]->id
        );

        $gestionnaire = $this->upsertPersonnel($gestionnaireUser, [
            'nom' => 'Demo',
            'prenom' => 'Gestionnaire',
            'telephone' => '0600001000',
            'matricule' => 'GST-DEMO-001',
            'fonction' => 'gestionnaire',
        ]);

        $formateurs = [
            'tais' => $this->createFormateur(
                $roles[Role::ROLE_FORMATEUR]->id,
                'Tais Adil',
                'tais.adil@ofppt.local',
                'Adil',
                'Tais',
                '0600001001',
                'FRM-DEMO-001'
            ),
            'gharib' => $this->createFormateur(
                $roles[Role::ROLE_FORMATEUR]->id,
                'Gharib Mohamed',
                'gharib.mohamed@ofppt.local',
                'Mohamed',
                'Gharib',
                '0600001002',
                'FRM-DEMO-002'
            ),
            'qarchaoui' => $this->createFormateur(
                $roles[Role::ROLE_FORMATEUR]->id,
                'Qarchaoui Omar',
                'qarchaoui.omar@ofppt.local',
                'Omar',
                'Qarchaoui',
                '0600001003',
                'FRM-DEMO-003'
            ),
        ];

        $groupes = [
            'DEV201' => $this->upsertGroupe([
                'nom' => 'DEV201',
                'filiere' => 'Developpement Digital',
                'code_filiere' => 'DD',
                'type_formation' => 'Initiale',
                'motif_admission' => 'Concours',
                'niveau' => 'Technicien Specialise',
                'annee_scolaire' => '2025-2026',
                'annee_formation' => '1ere annee',
            ]),
            'DEV202' => $this->upsertGroupe([
                'nom' => 'DEV202',
                'filiere' => 'Developpement Digital',
                'code_filiere' => 'DD',
                'type_formation' => 'Initiale',
                'motif_admission' => 'Concours',
                'niveau' => 'Technicien Specialise',
                'annee_scolaire' => '2025-2026',
                'annee_formation' => '2eme annee',
            ]),
            'IDA201' => $this->upsertGroupe([
                'nom' => 'IDA201',
                'filiere' => 'Infrastructure Digitale',
                'code_filiere' => 'ID',
                'type_formation' => 'Initiale',
                'motif_admission' => 'Concours',
                'niveau' => 'Technicien Specialise',
                'annee_scolaire' => '2025-2026',
                'annee_formation' => '1ere annee',
            ]),
            'IDA202' => $this->upsertGroupe([
                'nom' => 'IDA202',
                'filiere' => 'Infrastructure Digitale',
                'code_filiere' => 'ID',
                'type_formation' => 'Initiale',
                'motif_admission' => 'Concours',
                'niveau' => 'Technicien Specialise',
                'annee_scolaire' => '2025-2026',
                'annee_formation' => '2eme annee',
            ]),
            'TDI201' => $this->upsertGroupe([
                'nom' => 'TDI201',
                'filiere' => 'Techniques de Developpement Informatique',
                'code_filiere' => 'TDI',
                'type_formation' => 'Initiale',
                'motif_admission' => 'Concours',
                'niveau' => 'Technicien',
                'annee_scolaire' => '2025-2026',
                'annee_formation' => '1ere annee',
            ]),
            'TDI202' => $this->upsertGroupe([
                'nom' => 'TDI202',
                'filiere' => 'Techniques de Developpement Informatique',
                'code_filiere' => 'TDI',
                'type_formation' => 'Initiale',
                'motif_admission' => 'Concours',
                'niveau' => 'Technicien',
                'annee_scolaire' => '2025-2026',
                'annee_formation' => '2eme annee',
            ]),
            'TRI201' => $this->upsertGroupe([
                'nom' => 'TRI201',
                'filiere' => 'Techniques des Reseaux Informatiques',
                'code_filiere' => 'TRI',
                'type_formation' => 'Initiale',
                'motif_admission' => 'Concours',
                'niveau' => 'Technicien Specialise',
                'annee_scolaire' => '2025-2026',
                'annee_formation' => '1ere annee',
            ]),
            'TRI202' => $this->upsertGroupe([
                'nom' => 'TRI202',
                'filiere' => 'Techniques des Reseaux Informatiques',
                'code_filiere' => 'TRI',
                'type_formation' => 'Initiale',
                'motif_admission' => 'Concours',
                'niveau' => 'Technicien Specialise',
                'annee_scolaire' => '2025-2026',
                'annee_formation' => '2eme annee',
            ]),
        ];

        $stagiaireDefinitions = [
            [
                'key' => 'yassine_el_alaoui',
                'full_name' => 'Yassine El Alaoui',
                'email' => 'yassine.elalaoui@ofppt.local',
                'groupe' => 'DEV201',
                'numero_stagiaire' => 'DD-DEV201-001',
                'cin' => 'AA123451',
                'date_naissance' => '2004-03-14',
                'genre' => 'M',
                'niveau_scolaire' => 'Bac Sciences Physiques',
                'annee_bac' => '2022',
                'moyenne_bac' => 14.82,
                'telephone' => '0612000001',
            ],
            [
                'key' => 'salma_bennis',
                'full_name' => 'Salma Bennis',
                'email' => 'salma.bennis@ofppt.local',
                'groupe' => 'DEV201',
                'numero_stagiaire' => 'DD-DEV201-002',
                'cin' => 'BB223452',
                'date_naissance' => '2004-08-09',
                'genre' => 'F',
                'niveau_scolaire' => 'Bac Sciences Economiques',
                'annee_bac' => '2022',
                'moyenne_bac' => 15.31,
                'telephone' => '0612000002',
            ],
            [
                'key' => 'hamza_lahlou',
                'full_name' => 'Hamza Lahlou',
                'email' => 'hamza.lahlou@ofppt.local',
                'groupe' => 'DEV201',
                'numero_stagiaire' => 'DD-DEV201-003',
                'cin' => 'CC323453',
                'date_naissance' => '2003-12-21',
                'genre' => 'M',
                'niveau_scolaire' => 'Bac Sciences Maths',
                'annee_bac' => '2021',
                'moyenne_bac' => 13.94,
                'telephone' => '0612000003',
            ],
            [
                'key' => 'imane_tazi',
                'full_name' => 'Imane Tazi',
                'email' => 'imane.tazi@ofppt.local',
                'groupe' => 'DEV202',
                'numero_stagiaire' => 'DD-DEV202-001',
                'cin' => 'DD423454',
                'date_naissance' => '2003-06-03',
                'genre' => 'F',
                'niveau_scolaire' => 'Bac Sciences Maths',
                'annee_bac' => '2021',
                'moyenne_bac' => 16.11,
                'telephone' => '0612000004',
            ],
            [
                'key' => 'anas_idrissi',
                'full_name' => 'Anas Idrissi',
                'email' => 'anas.idrissi@ofppt.local',
                'groupe' => 'DEV202',
                'numero_stagiaire' => 'DD-DEV202-002',
                'cin' => 'EE523455',
                'date_naissance' => '2003-10-17',
                'genre' => 'M',
                'niveau_scolaire' => 'Bac Sciences Physiques',
                'annee_bac' => '2021',
                'moyenne_bac' => 14.47,
                'telephone' => '0612000005',
            ],
            [
                'key' => 'sara_chraibi',
                'full_name' => 'Sara Chraibi',
                'email' => 'sara.chraibi@ofppt.local',
                'groupe' => 'DEV202',
                'numero_stagiaire' => 'DD-DEV202-003',
                'cin' => 'FF623456',
                'date_naissance' => '2004-01-25',
                'genre' => 'F',
                'niveau_scolaire' => 'Bac SVT',
                'annee_bac' => '2022',
                'moyenne_bac' => 13.76,
                'telephone' => '0612000006',
            ],
            [
                'key' => 'oussama_amrani',
                'full_name' => 'Oussama Amrani',
                'email' => 'oussama.amrani@ofppt.local',
                'groupe' => 'TDI201',
                'numero_stagiaire' => 'TDI-TDI201-001',
                'cin' => 'GG723457',
                'date_naissance' => '2004-04-11',
                'genre' => 'M',
                'niveau_scolaire' => 'Bac Sciences Physiques',
                'annee_bac' => '2022',
                'moyenne_bac' => 14.08,
                'telephone' => '0612000007',
            ],
            [
                'key' => 'kawtar_el_fassi',
                'full_name' => 'Kawtar El Fassi',
                'email' => 'kawtar.elfassi@ofppt.local',
                'groupe' => 'TDI201',
                'numero_stagiaire' => 'TDI-TDI201-002',
                'cin' => 'HH823458',
                'date_naissance' => '2004-07-02',
                'genre' => 'F',
                'niveau_scolaire' => 'Bac Sciences Economiques',
                'annee_bac' => '2022',
                'moyenne_bac' => 15.04,
                'telephone' => '0612000008',
            ],
            [
                'key' => 'younes_barka',
                'full_name' => 'Younes Barka',
                'email' => 'younes.barka@ofppt.local',
                'groupe' => 'TDI201',
                'numero_stagiaire' => 'TDI-TDI201-003',
                'cin' => 'II923459',
                'date_naissance' => '2003-11-28',
                'genre' => 'M',
                'niveau_scolaire' => 'Bac Sciences Maths',
                'annee_bac' => '2021',
                'moyenne_bac' => 13.58,
                'telephone' => '0612000009',
            ],
            [
                'key' => 'mehdi_bennani',
                'full_name' => 'Mehdi Bennani',
                'email' => 'mehdi.bennani@ofppt.local',
                'groupe' => 'TRI201',
                'numero_stagiaire' => 'TRI-TRI201-001',
                'cin' => 'JJ123460',
                'date_naissance' => '2004-02-05',
                'genre' => 'M',
                'niveau_scolaire' => 'Bac Sciences Techniques',
                'annee_bac' => '2022',
                'moyenne_bac' => 14.66,
                'telephone' => '0612000010',
            ],
            [
                'key' => 'aya_rami',
                'full_name' => 'Aya Rami',
                'email' => 'aya.rami@ofppt.local',
                'groupe' => 'TRI201',
                'numero_stagiaire' => 'TRI-TRI201-002',
                'cin' => 'KK223461',
                'date_naissance' => '2004-09-13',
                'genre' => 'F',
                'niveau_scolaire' => 'Bac Sciences Physiques',
                'annee_bac' => '2022',
                'moyenne_bac' => 15.22,
                'telephone' => '0612000011',
            ],
            [
                'key' => 'zakaria_ait_lahcen',
                'full_name' => 'Zakaria Ait Lahcen',
                'email' => 'zakaria.aitlahcen@ofppt.local',
                'groupe' => 'TRI201',
                'numero_stagiaire' => 'TRI-TRI201-003',
                'cin' => 'LL323462',
                'date_naissance' => '2003-05-30',
                'genre' => 'M',
                'niveau_scolaire' => 'Bac Sciences Maths',
                'annee_bac' => '2021',
                'moyenne_bac' => 14.19,
                'telephone' => '0612000012',
            ],
        ];

        $stagiaires = [];

        foreach ($stagiaireDefinitions as $definition) {
            [$prenom, $nom] = $this->splitFullName($definition['full_name']);
            $user = $this->upsertUser(
                $definition['full_name'],
                $definition['email'],
                $roles[Role::ROLE_STAGIAIRE]->id
            );

            $stagiaires[$definition['key']] = $this->upsertStagiaire($user, $groupes[$definition['groupe']], [
                'numero_stagiaire' => $definition['numero_stagiaire'],
                'nom' => $nom,
                'prenom' => $prenom,
                'cin' => $definition['cin'],
                'date_naissance' => $definition['date_naissance'],
                'genre' => $definition['genre'],
                'niveau_scolaire' => $definition['niveau_scolaire'],
                'annee_bac' => $definition['annee_bac'],
                'moyenne_bac' => $definition['moyenne_bac'],
                'telephone' => $definition['telephone'],
                'photo' => null,
                'matricule' => 'STG-' . $definition['numero_stagiaire'],
                'note_assiduite' => 18,
                'niveau' => str_contains($definition['groupe'], '201') ? '1ere annee' : '2eme annee',
                'code_filiere' => $groupes[$definition['groupe']]->code_filiere,
                'filiere' => $groupes[$definition['groupe']]->filiere,
                'type_formation' => 'Initiale',
                'annee_etude' => str_contains($definition['groupe'], '201') ? '1ere annee' : '2eme annee',
                'nationalite' => 'Marocaine',
                'date_inscription' => '2025-09-15',
                'date_dossier_complet' => '2025-09-20',
                'motif_admission' => 'Concours',
                'statut' => 'actif',
            ]);
        }

        $seances = [
            'laravel_dev201' => $this->upsertSeance($groupes['DEV201'], $formateurs['tais'], [
                'module' => 'Laravel',
                'date_seance' => '2026-04-07',
                'heure_debut' => '08:30:00',
                'heure_fin' => '10:30:00',
                'salle' => 'LAB-WEB-1',
            ]),
            'bdd_dev202' => $this->upsertSeance($groupes['DEV202'], $formateurs['tais'], [
                'module' => 'Base de donnees',
                'date_seance' => '2026-04-08',
                'heure_debut' => '10:45:00',
                'heure_fin' => '12:45:00',
                'salle' => 'LAB-DATA-2',
            ]),
            'js_dev201' => $this->upsertSeance($groupes['DEV201'], $formateurs['gharib'], [
                'module' => 'JavaScript',
                'date_seance' => '2026-04-09',
                'heure_debut' => '13:30:00',
                'heure_fin' => '15:30:00',
                'salle' => 'LAB-WEB-2',
            ]),
            'reseaux_tri201' => $this->upsertSeance($groupes['TRI201'], $formateurs['qarchaoui'], [
                'module' => 'Reseaux',
                'date_seance' => '2026-04-10',
                'heure_debut' => '09:00:00',
                'heure_fin' => '11:00:00',
                'salle' => 'LAB-RESEAU-1',
            ]),
            'php_tdi201' => $this->upsertSeance($groupes['TDI201'], $formateurs['qarchaoui'], [
                'module' => 'PHP',
                'date_seance' => '2026-04-11',
                'heure_debut' => '08:30:00',
                'heure_fin' => '10:30:00',
                'salle' => 'LAB-PHP-1',
            ]),
            'uml_dev202' => $this->upsertSeance($groupes['DEV202'], $formateurs['gharib'], [
                'module' => 'UML',
                'date_seance' => '2026-04-11',
                'heure_debut' => '13:30:00',
                'heure_fin' => '15:00:00',
                'salle' => 'SALLE-UML',
            ]),
            'merise_tdi201' => $this->upsertSeance($groupes['TDI201'], $formateurs['gharib'], [
                'module' => 'Merise',
                'date_seance' => '2026-04-12',
                'heure_debut' => '10:45:00',
                'heure_fin' => '12:15:00',
                'salle' => 'SALLE-MERISE',
            ]),
            'php_dev202' => $this->upsertSeance($groupes['DEV202'], $formateurs['qarchaoui'], [
                'module' => 'PHP',
                'date_seance' => '2026-04-12',
                'heure_debut' => '13:30:00',
                'heure_fin' => '15:30:00',
                'salle' => 'LAB-PHP-2',
            ]),
        ];

        $absences = [
            'yassine_laravel' => $this->upsertAbsence($stagiaires['yassine_el_alaoui'], $seances['laravel_dev201'], [
                'type_absence' => 'absence',
                'statut' => 'non_justifiee',
                'commentaire' => 'Absence non signalee sur le module Laravel.',
                'duree_minutes' => 120,
            ]),
            'salma_js' => $this->upsertAbsence($stagiaires['salma_bennis'], $seances['js_dev201'], [
                'type_absence' => 'absence',
                'statut' => 'justifiee',
                'commentaire' => 'Absence justifiee pour consultation medicale.',
                'duree_minutes' => 120,
            ]),
            'hamza_js' => $this->upsertAbsence($stagiaires['hamza_lahlou'], $seances['js_dev201'], [
                'type_absence' => 'retard',
                'statut' => 'en_attente',
                'commentaire' => 'Retard avec document en cours de validation.',
                'duree_minutes' => 35,
            ]),
            'imane_bdd' => $this->upsertAbsence($stagiaires['imane_tazi'], $seances['bdd_dev202'], [
                'type_absence' => 'absence',
                'statut' => 'non_justifiee',
                'commentaire' => 'Absence complete en base de donnees.',
                'duree_minutes' => 120,
            ]),
            'anas_uml' => $this->upsertAbsence($stagiaires['anas_idrissi'], $seances['uml_dev202'], [
                'type_absence' => 'absence',
                'statut' => 'justifiee',
                'commentaire' => 'Absence justifiee par rendez-vous administratif.',
                'duree_minutes' => 90,
            ]),
            'mehdi_reseaux' => $this->upsertAbsence($stagiaires['mehdi_bennani'], $seances['reseaux_tri201'], [
                'type_absence' => 'absence',
                'statut' => 'non_justifiee',
                'commentaire' => 'Absence non justifiee sur la seance reseaux.',
                'duree_minutes' => 120,
            ]),
        ];

        $this->upsertJustificatif($absences['salma_js'], [
            'fichier' => 'justificatifs/demo/salma-bennis-certificat.pdf',
            'type_fichier' => 'pdf',
            'statut' => 'valide',
            'motif_refus' => null,
            'date_depot' => '2026-04-09 17:10:00',
        ]);

        $this->upsertJustificatif($absences['hamza_js'], [
            'fichier' => 'justificatifs/demo/hamza-lahlou-retard.pdf',
            'type_fichier' => 'pdf',
            'statut' => 'en_attente',
            'motif_refus' => null,
            'date_depot' => '2026-04-09 18:00:00',
        ]);

        $this->upsertBillet($stagiaires['hamza_lahlou'], $gestionnaire, [
            'absence_id' => $absences['hamza_js']->id,
            'type' => 'retard',
            'code_unique' => 'BLT-HAMZA-RETARD-001',
            'qr_code' => 'QR-HAMZA-RETARD-001',
            'motif' => 'Billet de retard exceptionnel pour probleme de transport.',
            'date_validite' => '2026-04-09 23:59:59',
            'duree_retard_minutes' => 40,
            'est_actif' => true,
        ]);

        $this->upsertBillet($stagiaires['aya_rami'], $gestionnaire, [
            'absence_id' => null,
            'type' => 'entree',
            'code_unique' => 'BLT-AYA-ENTREE-001',
            'qr_code' => 'QR-AYA-ENTREE-001',
            'motif' => 'Autorisation d entree apres convocation administrative.',
            'date_validite' => '2026-04-10 23:59:59',
            'duree_retard_minutes' => null,
            'est_actif' => true,
        ]);

        $this->upsertNotification($stagiaires['yassine_el_alaoui'], [
            'type_notif' => 'absence_non_justifiee',
            'message' => 'Une absence non justifiee a ete enregistree sur votre seance Laravel.',
            'date_envoi' => '2026-04-07 11:00:00',
            'vu' => false,
        ]);

        $this->upsertNotification($stagiaires['hamza_lahlou'], [
            'type_notif' => 'justificatif_en_attente',
            'message' => 'Votre justificatif de retard est en attente de validation.',
            'date_envoi' => '2026-04-09 18:05:00',
            'vu' => false,
        ]);

        $this->upsertNotification($stagiaires['salma_bennis'], [
            'type_notif' => 'justificatif_valide',
            'message' => 'Votre justificatif pour l absence JavaScript a ete valide.',
            'date_envoi' => '2026-04-09 18:30:00',
            'vu' => true,
        ]);

        $noteCalculationService = app(NoteCalculationService::class);

        foreach ($stagiaires as $stagiaire) {
            $noteCalculationService->calculateForStagiaire($stagiaire->fresh('groupe'));
        }
    }

    private function seedRoles(): array
    {
        $definitions = [
            Role::ROLE_STAGIAIRE => 'Consulte ses absences et justificatifs',
            Role::ROLE_FORMATEUR => 'Saisit les absences et consulte ses seances',
            Role::ROLE_GESTIONNAIRE => 'Administre les stagiaires, justificatifs et billets',
            Role::ROLE_DIRECTEUR => 'Consulte les statistiques globales',
            Role::ROLE_ADMIN => 'Administre la plateforme',
        ];

        $roles = [];

        foreach ($definitions as $name => $description) {
            $roles[$name] = Role::updateOrCreate(
                ['nom' => $name],
                ['description' => $description]
            );
        }

        return $roles;
    }

    private function createFormateur(
        int $roleId,
        string $displayName,
        string $email,
        string $prenom,
        string $nom,
        string $telephone,
        string $matricule
    ): Personnel {
        $user = $this->upsertUser($displayName, $email, $roleId);

        return $this->upsertPersonnel($user, [
            'nom' => $nom,
            'prenom' => $prenom,
            'telephone' => $telephone,
            'matricule' => $matricule,
            'fonction' => 'formateur',
        ]);
    }

    private function upsertUser(string $name, string $email, int $roleId): User
    {
        return User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make('Password!123'),
                'role_id' => $roleId,
                'must_change_password' => false,
                'status' => 'active',
            ]
        );
    }

    private function upsertPersonnel(User $user, array $attributes): Personnel
    {
        return Personnel::updateOrCreate(
            ['user_id' => $user->id],
            $attributes
        );
    }

    private function upsertGroupe(array $attributes): Groupe
    {
        $groupe = Groupe::firstOrCreate(
            ['nom' => $attributes['nom']],
            $attributes
        );

        if ($groupe->wasRecentlyCreated) {
            return $groupe;
        }

        $missingAttributes = collect($attributes)
            ->filter(fn ($value, $key) => blank($groupe->{$key}) && filled($value))
            ->all();

        if ($missingAttributes !== []) {
            $groupe->fill($missingAttributes);
            $groupe->save();
        }

        return $groupe;
    }

    private function upsertStagiaire(User $user, Groupe $groupe, array $attributes): Stagiaire
    {
        return Stagiaire::updateOrCreate(
            ['user_id' => $user->id],
            array_merge($attributes, [
                'groupe_id' => $groupe->id,
            ])
        );
    }

    private function upsertSeance(Groupe $groupe, Personnel $personnel, array $attributes): Seance
    {
        return Seance::updateOrCreate(
            [
                'groupe_id' => $groupe->id,
                'personnel_id' => $personnel->id,
                'module' => $attributes['module'],
                'date_seance' => $attributes['date_seance'],
                'heure_debut' => $attributes['heure_debut'],
            ],
            array_merge($attributes, [
                'groupe_id' => $groupe->id,
                'personnel_id' => $personnel->id,
            ])
        );
    }

    private function upsertAbsence(Stagiaire $stagiaire, Seance $seance, array $attributes): Absence
    {
        return Absence::updateOrCreate(
            [
                'stagiaire_id' => $stagiaire->id,
                'seance_id' => $seance->id,
            ],
            $attributes
        );
    }

    private function upsertJustificatif(Absence $absence, array $attributes): Justificatif
    {
        return Justificatif::updateOrCreate(
            ['absence_id' => $absence->id],
            $attributes
        );
    }

    private function upsertBillet(Stagiaire $stagiaire, Personnel $personnel, array $attributes): Billet
    {
        return Billet::updateOrCreate(
            ['code_unique' => $attributes['code_unique']],
            array_merge($attributes, [
                'stagiaire_id' => $stagiaire->id,
                'personnel_id' => $personnel->id,
            ])
        );
    }

    private function upsertNotification(Stagiaire $stagiaire, array $attributes): Notification
    {
        return Notification::updateOrCreate(
            [
                'stagiaire_id' => $stagiaire->id,
                'type_notif' => $attributes['type_notif'],
                'message' => $attributes['message'],
            ],
            [
                'date_envoi' => $attributes['date_envoi'],
                'vu' => $attributes['vu'],
            ]
        );
    }

    private function splitFullName(string $fullName): array
    {
        $parts = preg_split('/\s+/', trim($fullName)) ?: [];
        $prenom = array_shift($parts) ?? $fullName;
        $nom = implode(' ', $parts);

        return [$prenom, $nom === '' ? $prenom : $nom];
    }
}
