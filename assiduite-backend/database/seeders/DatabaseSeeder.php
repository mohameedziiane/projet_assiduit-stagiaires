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
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $roles = $this->seedRoles();

        $users = [
            'admin' => $this->upsertUser(
                'Super Admin',
                'admin@example.com',
                $roles['admin']->id
            ),
            'directeur' => $this->upsertUser(
                'Nadia El Mansouri',
                'directeur@example.com',
                $roles['directeur']->id
            ),
            'gestionnaire' => $this->upsertUser(
                'Karim Bennani',
                'gestionnaire@example.com',
                $roles['gestionnaire']->id
            ),
            'formateur_sara' => $this->upsertUser(
                'Sara Alaoui',
                'formateur.sara@example.com',
                $roles['formateur']->id
            ),
            'formateur_youssef' => $this->upsertUser(
                'Youssef Haddad',
                'formateur.youssef@example.com',
                $roles['formateur']->id
            ),
            'yassine' => $this->upsertUser(
                'Yassine El Amrani',
                'yassine.elamrani@example.com',
                $roles['stagiaire']->id
            ),
            'salma' => $this->upsertUser(
                'Salma Bennis',
                'salma.bennis@example.com',
                $roles['stagiaire']->id
            ),
            'imane' => $this->upsertUser(
                'Imane Alaoui',
                'imane.alaoui@example.com',
                $roles['stagiaire']->id
            ),
            'aya' => $this->upsertUser(
                'Aya Tazi',
                'aya.tazi@example.com',
                $roles['stagiaire']->id
            ),
            'omar' => $this->upsertUser(
                'Omar Chraibi',
                'omar.chraibi@example.com',
                $roles['stagiaire']->id
            ),
            'khadija' => $this->upsertUser(
                'Khadija Laaroussi',
                'khadija.laaroussi@example.com',
                $roles['stagiaire']->id
            ),
            'meryem' => $this->upsertUser(
                'Meryem Zahraoui',
                'meryem.zahraoui@example.com',
                $roles['stagiaire']->id
            ),
            'anas' => $this->upsertUser(
                'Anas Boulahya',
                'anas.boulahya@example.com',
                $roles['stagiaire']->id
            ),
        ];

        $personnels = [
            'admin' => $this->upsertPersonnel($users['admin'], [
                'nom' => 'Admin',
                'prenom' => 'Super',
                'telephone' => '0601000000',
                'matricule' => 'ADM-001',
                'fonction' => 'admin',
            ]),
            'directeur' => $this->upsertPersonnel($users['directeur'], [
                'nom' => 'El Mansouri',
                'prenom' => 'Nadia',
                'telephone' => '0601000001',
                'matricule' => 'DIR-001',
                'fonction' => 'directeur',
            ]),
            'gestionnaire' => $this->upsertPersonnel($users['gestionnaire'], [
                'nom' => 'Bennani',
                'prenom' => 'Karim',
                'telephone' => '0601000002',
                'matricule' => 'GST-001',
                'fonction' => 'gestionnaire',
            ]),
            'formateur_sara' => $this->upsertPersonnel($users['formateur_sara'], [
                'nom' => 'Alaoui',
                'prenom' => 'Sara',
                'telephone' => '0601000003',
                'matricule' => 'FRM-001',
                'fonction' => 'formateur',
            ]),
            'formateur_youssef' => $this->upsertPersonnel($users['formateur_youssef'], [
                'nom' => 'Haddad',
                'prenom' => 'Youssef',
                'telephone' => '0601000004',
                'matricule' => 'FRM-002',
                'fonction' => 'formateur',
            ]),
        ];

        $groupes = [
            'dev201' => $this->upsertGroupe([
                'nom' => 'DEV201',
                'filiere' => 'Developpement Digital Web',
                'code_filiere' => 'DD',
                'type_formation' => 'Initiale',
                'motif_admission' => 'Concours',
                'niveau' => 'Technicien Specialise',
                'annee_scolaire' => '2025-2026',
                'annee_formation' => '2',
            ]),
            'dev202' => $this->upsertGroupe([
                'nom' => 'DEV202',
                'filiere' => 'Developpement Digital Mobile',
                'code_filiere' => 'DD',
                'type_formation' => 'Initiale',
                'motif_admission' => 'Concours',
                'niveau' => 'Technicien',
                'annee_scolaire' => '2025-2026',
                'annee_formation' => '1',
            ]),
            'ida201' => $this->upsertGroupe([
                'nom' => 'IDA201',
                'filiere' => 'Infrastructure Digitale',
                'code_filiere' => 'IDA',
                'type_formation' => 'Initiale',
                'motif_admission' => 'Concours',
                'niveau' => 'Technicien Specialise',
                'annee_scolaire' => '2025-2026',
                'annee_formation' => '2',
            ]),
        ];

        $stagiaires = [
            'yassine' => $this->upsertStagiaire($users['yassine'], $groupes['dev201'], [
                'numero_stagiaire' => 'STA-DEV201-001',
                'nom' => 'El Amrani',
                'prenom' => 'Yassine',
                'cin' => 'AB123456',
                'date_naissance' => '2004-05-09',
                'genre' => 'M',
                'niveau_scolaire' => 'Bac Sciences Physiques',
                'annee_bac' => '2022',
                'moyenne_bac' => 14.50,
                'telephone' => '0611111111',
                'photo' => null,
                'matricule' => 'M-DEV201-001',
                'note_assiduite' => 14.00,
            ]),
            'salma' => $this->upsertStagiaire($users['salma'], $groupes['dev201'], [
                'numero_stagiaire' => 'STA-DEV201-002',
                'nom' => 'Bennis',
                'prenom' => 'Salma',
                'cin' => 'CD234567',
                'date_naissance' => '2003-11-20',
                'genre' => 'F',
                'niveau_scolaire' => 'Bac Sciences Economiques',
                'annee_bac' => '2021',
                'moyenne_bac' => 15.20,
                'telephone' => '0611111112',
                'photo' => null,
                'matricule' => 'M-DEV201-002',
                'note_assiduite' => 15.50,
            ]),
            'imane' => $this->upsertStagiaire($users['imane'], $groupes['dev201'], [
                'numero_stagiaire' => 'STA-DEV201-003',
                'nom' => 'Alaoui',
                'prenom' => 'Imane',
                'cin' => 'EF345678',
                'date_naissance' => '2004-01-13',
                'genre' => 'F',
                'niveau_scolaire' => 'Bac Sciences Math A',
                'annee_bac' => '2022',
                'moyenne_bac' => 16.00,
                'telephone' => '0611111113',
                'photo' => null,
                'matricule' => 'M-DEV201-003',
                'note_assiduite' => 18.00,
            ]),
            'aya' => $this->upsertStagiaire($users['aya'], $groupes['dev202'], [
                'numero_stagiaire' => 'STA-DEV202-001',
                'nom' => 'Tazi',
                'prenom' => 'Aya',
                'cin' => 'GH456789',
                'date_naissance' => '2005-02-17',
                'genre' => 'F',
                'niveau_scolaire' => 'Bac Sciences Maths B',
                'annee_bac' => '2023',
                'moyenne_bac' => 13.80,
                'telephone' => '0611111114',
                'photo' => null,
                'matricule' => 'M-DEV202-001',
                'note_assiduite' => 12.50,
            ]),
            'omar' => $this->upsertStagiaire($users['omar'], $groupes['dev202'], [
                'numero_stagiaire' => 'STA-DEV202-002',
                'nom' => 'Chraibi',
                'prenom' => 'Omar',
                'cin' => 'IJ567890',
                'date_naissance' => '2004-09-24',
                'genre' => 'M',
                'niveau_scolaire' => 'Bac Sciences Physiques',
                'annee_bac' => '2022',
                'moyenne_bac' => 14.10,
                'telephone' => '0611111115',
                'photo' => null,
                'matricule' => 'M-DEV202-002',
                'note_assiduite' => 16.00,
            ]),
            'khadija' => $this->upsertStagiaire($users['khadija'], $groupes['dev202'], [
                'numero_stagiaire' => 'STA-DEV202-003',
                'nom' => 'Laaroussi',
                'prenom' => 'Khadija',
                'cin' => 'KL678901',
                'date_naissance' => '2005-06-04',
                'genre' => 'F',
                'niveau_scolaire' => 'Bac Lettres',
                'annee_bac' => '2023',
                'moyenne_bac' => 12.70,
                'telephone' => '0611111116',
                'photo' => null,
                'matricule' => 'M-DEV202-003',
                'note_assiduite' => 17.00,
            ]),
            'meryem' => $this->upsertStagiaire($users['meryem'], $groupes['ida201'], [
                'numero_stagiaire' => 'STA-IDA201-001',
                'nom' => 'Zahraoui',
                'prenom' => 'Meryem',
                'cin' => 'MN789012',
                'date_naissance' => '2003-12-02',
                'genre' => 'F',
                'niveau_scolaire' => 'Bac Sciences Physiques',
                'annee_bac' => '2021',
                'moyenne_bac' => 13.60,
                'telephone' => '0611111117',
                'photo' => null,
                'matricule' => 'M-IDA201-001',
                'note_assiduite' => 10.00,
            ]),
            'anas' => $this->upsertStagiaire($users['anas'], $groupes['ida201'], [
                'numero_stagiaire' => 'STA-IDA201-002',
                'nom' => 'Boulahya',
                'prenom' => 'Anas',
                'cin' => 'OP890123',
                'date_naissance' => '2004-08-12',
                'genre' => 'M',
                'niveau_scolaire' => 'Bac Sciences Math A',
                'annee_bac' => '2022',
                'moyenne_bac' => 15.00,
                'telephone' => '0611111118',
                'photo' => null,
                'matricule' => 'M-IDA201-002',
                'note_assiduite' => 17.50,
            ]),
        ];

        $seances = [
            'dev201_react' => $this->upsertSeance($groupes['dev201'], $personnels['formateur_sara'], [
                'module' => 'React Fundamentals',
                'date_seance' => '2026-03-03',
                'heure_debut' => '08:30:00',
                'heure_fin' => '10:30:00',
                'salle' => 'B12',
            ]),
            'dev201_laravel' => $this->upsertSeance($groupes['dev201'], $personnels['formateur_sara'], [
                'module' => 'Laravel APIs',
                'date_seance' => '2026-03-17',
                'heure_debut' => '10:45:00',
                'heure_fin' => '12:45:00',
                'salle' => 'B14',
            ]),
            'dev201_mcd' => $this->upsertSeance($groupes['dev201'], $personnels['formateur_youssef'], [
                'module' => 'Modelisation MCD',
                'date_seance' => '2026-03-31',
                'heure_debut' => '13:30:00',
                'heure_fin' => '15:00:00',
                'salle' => 'C03',
            ]),
            'dev201_js' => $this->upsertSeance($groupes['dev201'], $personnels['formateur_sara'], [
                'module' => 'JavaScript Avance',
                'date_seance' => '2026-04-03',
                'heure_debut' => '08:30:00',
                'heure_fin' => '10:30:00',
                'salle' => 'B12',
            ]),
            'dev201_projet' => $this->upsertSeance($groupes['dev201'], $personnels['formateur_youssef'], [
                'module' => 'Projet Fil Rouge',
                'date_seance' => '2026-04-10',
                'heure_debut' => '10:45:00',
                'heure_fin' => '12:15:00',
                'salle' => 'LAB-2',
            ]),
            'dev202_algo' => $this->upsertSeance($groupes['dev202'], $personnels['formateur_sara'], [
                'module' => 'Algorithmique',
                'date_seance' => '2026-03-05',
                'heure_debut' => '09:00:00',
                'heure_fin' => '11:00:00',
                'salle' => 'A02',
            ]),
            'dev202_flutter' => $this->upsertSeance($groupes['dev202'], $personnels['formateur_sara'], [
                'module' => 'Flutter Widgets',
                'date_seance' => '2026-03-19',
                'heure_debut' => '13:30:00',
                'heure_fin' => '15:00:00',
                'salle' => 'A02',
            ]),
            'dev202_db' => $this->upsertSeance($groupes['dev202'], $personnels['formateur_youssef'], [
                'module' => 'Base de Donnees Mobile',
                'date_seance' => '2026-04-09',
                'heure_debut' => '09:00:00',
                'heure_fin' => '11:00:00',
                'salle' => 'A05',
            ]),
            'ida201_reseaux' => $this->upsertSeance($groupes['ida201'], $personnels['formateur_youssef'], [
                'module' => 'Reseaux',
                'date_seance' => '2026-03-10',
                'heure_debut' => '08:30:00',
                'heure_fin' => '10:30:00',
                'salle' => 'LAB-RESEAU',
            ]),
            'ida201_linux' => $this->upsertSeance($groupes['ida201'], $personnels['formateur_youssef'], [
                'module' => 'Administration Linux',
                'date_seance' => '2026-03-24',
                'heure_debut' => '10:45:00',
                'heure_fin' => '12:45:00',
                'salle' => 'LAB-RESEAU',
            ]),
            'ida201_securite' => $this->upsertSeance($groupes['ida201'], $personnels['formateur_sara'], [
                'module' => 'Cyber Hygiene',
                'date_seance' => '2026-04-08',
                'heure_debut' => '13:30:00',
                'heure_fin' => '15:30:00',
                'salle' => 'LAB-SEC',
            ]),
            'dev201_ux' => $this->upsertSeance($groupes['dev201'], $personnels['formateur_sara'], [
                'module' => 'UX et Maquettage',
                'date_seance' => '2026-04-11',
                'heure_debut' => '08:30:00',
                'heure_fin' => '10:30:00',
                'salle' => 'B15',
            ]),
            'dev202_api' => $this->upsertSeance($groupes['dev202'], $personnels['formateur_youssef'], [
                'module' => 'API Mobile',
                'date_seance' => '2026-04-11',
                'heure_debut' => '10:45:00',
                'heure_fin' => '12:45:00',
                'salle' => 'A07',
            ]),
            'ida201_virtualisation' => $this->upsertSeance($groupes['ida201'], $personnels['formateur_youssef'], [
                'module' => 'Virtualisation',
                'date_seance' => '2026-04-14',
                'heure_debut' => '09:00:00',
                'heure_fin' => '11:00:00',
                'salle' => 'LAB-SYS',
            ]),
        ];

        $absences = [
            'yassine_1' => $this->upsertAbsence($stagiaires['yassine'], $seances['dev201_react'], [
                'type_absence' => 'absence',
                'statut' => 'non_justifiee',
                'commentaire' => 'Absence non signalee au debut de la seance.',
                'duree_minutes' => 120,
            ]),
            'yassine_2' => $this->upsertAbsence($stagiaires['yassine'], $seances['dev201_laravel'], [
                'type_absence' => 'absence',
                'statut' => 'justifiee',
                'commentaire' => 'Absence regularisee avec certificat medical.',
                'duree_minutes' => 120,
            ]),
            'yassine_3' => $this->upsertAbsence($stagiaires['yassine'], $seances['dev201_mcd'], [
                'type_absence' => 'retard',
                'statut' => 'en_attente',
                'commentaire' => 'Justificatif depose, en attente de validation.',
                'duree_minutes' => 90,
            ]),
            'yassine_4' => $this->upsertAbsence($stagiaires['yassine'], $seances['dev201_js'], [
                'type_absence' => 'absence',
                'statut' => 'non_justifiee',
                'commentaire' => 'Aucune justification recue.',
                'duree_minutes' => 120,
            ]),
            'yassine_5' => $this->upsertAbsence($stagiaires['yassine'], $seances['dev201_projet'], [
                'type_absence' => 'retard',
                'statut' => 'non_justifiee',
                'commentaire' => 'Retard important, justificatif refuse.',
                'duree_minutes' => 90,
            ]),
            'salma_1' => $this->upsertAbsence($stagiaires['salma'], $seances['dev201_react'], [
                'type_absence' => 'absence',
                'statut' => 'non_justifiee',
                'commentaire' => 'Absence sans information prealable.',
                'duree_minutes' => 120,
            ]),
            'salma_2' => $this->upsertAbsence($stagiaires['salma'], $seances['dev201_js'], [
                'type_absence' => 'absence',
                'statut' => 'justifiee',
                'commentaire' => 'Absence justifiee pour rendez-vous medical.',
                'duree_minutes' => 120,
            ]),
            'aya_1' => $this->upsertAbsence($stagiaires['aya'], $seances['dev202_algo'], [
                'type_absence' => 'absence',
                'statut' => 'non_justifiee',
                'commentaire' => 'Absence constatee au debut de la seance.',
                'duree_minutes' => 120,
            ]),
            'aya_2' => $this->upsertAbsence($stagiaires['aya'], $seances['dev202_db'], [
                'type_absence' => 'absence',
                'statut' => 'en_attente',
                'commentaire' => 'Document depose, traitement en attente.',
                'duree_minutes' => 120,
            ]),
            'omar_1' => $this->upsertAbsence($stagiaires['omar'], $seances['dev202_flutter'], [
                'type_absence' => 'retard',
                'statut' => 'justifiee',
                'commentaire' => 'Retard justifie par probleme de transport.',
                'duree_minutes' => 90,
            ]),
            'meryem_1' => $this->upsertAbsence($stagiaires['meryem'], $seances['ida201_reseaux'], [
                'type_absence' => 'absence',
                'statut' => 'non_justifiee',
                'commentaire' => 'Absence non justifiee.',
                'duree_minutes' => 120,
            ]),
            'meryem_2' => $this->upsertAbsence($stagiaires['meryem'], $seances['ida201_linux'], [
                'type_absence' => 'absence',
                'statut' => 'non_justifiee',
                'commentaire' => 'Deuxieme absence non justifiee.',
                'duree_minutes' => 120,
            ]),
            'meryem_3' => $this->upsertAbsence($stagiaires['meryem'], $seances['ida201_securite'], [
                'type_absence' => 'absence',
                'statut' => 'non_justifiee',
                'commentaire' => 'Seuil d alerte atteint.',
                'duree_minutes' => 120,
            ]),
            'anas_1' => $this->upsertAbsence($stagiaires['anas'], $seances['ida201_linux'], [
                'type_absence' => 'retard',
                'statut' => 'justifiee',
                'commentaire' => 'Retard ponctuel regularise.',
                'duree_minutes' => 30,
            ]),
            'imane_1' => $this->upsertAbsence($stagiaires['imane'], $seances['dev201_ux'], [
                'type_absence' => 'absence',
                'statut' => 'non_justifiee',
                'commentaire' => 'Absence constatee sur la seance de maquettage.',
                'duree_minutes' => 120,
            ]),
            'salma_3' => $this->upsertAbsence($stagiaires['salma'], $seances['dev201_ux'], [
                'type_absence' => 'retard',
                'statut' => 'en_attente',
                'commentaire' => 'Document annonce, validation en attente.',
                'duree_minutes' => 45,
            ]),
            'khadija_1' => $this->upsertAbsence($stagiaires['khadija'], $seances['dev202_db'], [
                'type_absence' => 'absence',
                'statut' => 'non_justifiee',
                'commentaire' => 'Absence complete sur le module base de donnees.',
                'duree_minutes' => 120,
            ]),
            'khadija_2' => $this->upsertAbsence($stagiaires['khadija'], $seances['dev202_api'], [
                'type_absence' => 'retard',
                'statut' => 'justifiee',
                'commentaire' => 'Retard justifie par un incident de transport.',
                'duree_minutes' => 35,
            ]),
            'omar_2' => $this->upsertAbsence($stagiaires['omar'], $seances['dev202_api'], [
                'type_absence' => 'absence',
                'statut' => 'non_justifiee',
                'commentaire' => 'Absence relevee sur la seance API Mobile.',
                'duree_minutes' => 120,
            ]),
            'anas_2' => $this->upsertAbsence($stagiaires['anas'], $seances['ida201_virtualisation'], [
                'type_absence' => 'absence',
                'statut' => 'en_attente',
                'commentaire' => 'Justificatif depose apres la seance de virtualisation.',
                'duree_minutes' => 120,
            ]),
            'meryem_4' => $this->upsertAbsence($stagiaires['meryem'], $seances['ida201_virtualisation'], [
                'type_absence' => 'retard',
                'statut' => 'justifiee',
                'commentaire' => 'Retard ponctuel couvert par un billet.',
                'duree_minutes' => 40,
            ]),
        ];

        $this->upsertJustificatif($absences['yassine_2'], [
            'fichier' => 'justificatifs/demo/yassine-medical.pdf',
            'type_fichier' => 'pdf',
            'statut' => 'accepte',
            'motif_refus' => null,
            'date_depot' => '2026-03-17 18:10:00',
        ]);
        $this->upsertJustificatif($absences['yassine_3'], [
            'fichier' => 'justificatifs/demo/yassine-transport.pdf',
            'type_fichier' => 'pdf',
            'statut' => 'en_attente',
            'motif_refus' => null,
            'date_depot' => '2026-03-31 17:45:00',
        ]);
        $this->upsertJustificatif($absences['yassine_5'], [
            'fichier' => 'justificatifs/demo/yassine-retard.jpg',
            'type_fichier' => 'jpg',
            'statut' => 'refuse',
            'motif_refus' => 'Document illisible et hors delai.',
            'date_depot' => '2026-04-10 16:00:00',
        ]);
        $this->upsertJustificatif($absences['salma_2'], [
            'fichier' => 'justificatifs/demo/salma-rdv.pdf',
            'type_fichier' => 'pdf',
            'statut' => 'accepte',
            'motif_refus' => null,
            'date_depot' => '2026-04-03 14:20:00',
        ]);
        $this->upsertJustificatif($absences['aya_2'], [
            'fichier' => 'justificatifs/demo/aya-absence.png',
            'type_fichier' => 'png',
            'statut' => 'en_attente',
            'motif_refus' => null,
            'date_depot' => '2026-04-09 17:05:00',
        ]);
        $this->upsertJustificatif($absences['omar_1'], [
            'fichier' => 'justificatifs/demo/omar-transport.pdf',
            'type_fichier' => 'pdf',
            'statut' => 'accepte',
            'motif_refus' => null,
            'date_depot' => '2026-03-19 16:40:00',
        ]);
        $this->upsertJustificatif($absences['anas_1'], [
            'fichier' => 'justificatifs/demo/anas-retard.pdf',
            'type_fichier' => 'pdf',
            'statut' => 'accepte',
            'motif_refus' => null,
            'date_depot' => '2026-03-24 15:15:00',
        ]);
        $this->upsertJustificatif($absences['salma_3'], [
            'fichier' => 'justificatifs/demo/salma-retard-avril.pdf',
            'type_fichier' => 'pdf',
            'statut' => 'en_attente',
            'motif_refus' => null,
            'date_depot' => '2026-04-11 13:10:00',
        ]);
        $this->upsertJustificatif($absences['khadija_2'], [
            'fichier' => 'justificatifs/demo/khadija-transport.pdf',
            'type_fichier' => 'pdf',
            'statut' => 'accepte',
            'motif_refus' => null,
            'date_depot' => '2026-04-11 14:05:00',
        ]);
        $this->upsertJustificatif($absences['anas_2'], [
            'fichier' => 'justificatifs/demo/anas-virtualisation.png',
            'type_fichier' => 'png',
            'statut' => 'en_attente',
            'motif_refus' => null,
            'date_depot' => '2026-04-14 11:20:00',
        ]);
        $this->upsertJustificatif($absences['meryem_4'], [
            'fichier' => 'justificatifs/demo/meryem-retard.pdf',
            'type_fichier' => 'pdf',
            'statut' => 'accepte',
            'motif_refus' => null,
            'date_depot' => '2026-04-14 11:05:00',
        ]);

        $this->upsertBillet($stagiaires['yassine'], $personnels['gestionnaire'], [
            'absence_id' => $absences['yassine_5']->id,
            'type' => 'retard',
            'code_unique' => 'BLT-YAS-001',
            'qr_code' => 'QR-BLT-YAS-001',
            'motif' => 'Autorisation exceptionnelle de retard.',
            'date_validite' => '2026-04-15 23:59:59',
            'duree_retard_minutes' => 20,
            'est_actif' => true,
        ]);
        $this->upsertBillet($stagiaires['salma'], $personnels['gestionnaire'], [
            'absence_id' => null,
            'type' => 'entree',
            'code_unique' => 'BLT-SAL-001',
            'qr_code' => 'QR-BLT-SAL-001',
            'motif' => 'Autorisation d entree exceptionnelle.',
            'date_validite' => '2026-04-12 23:59:59',
            'duree_retard_minutes' => null,
            'est_actif' => true,
        ]);
        $this->upsertBillet($stagiaires['aya'], $personnels['gestionnaire'], [
            'absence_id' => $absences['aya_2']->id,
            'type' => 'absence',
            'code_unique' => 'BLT-AYA-001',
            'qr_code' => 'QR-BLT-AYA-001',
            'motif' => 'Billet lie a une absence en cours de regularisation.',
            'date_validite' => '2026-04-01 23:59:59',
            'duree_retard_minutes' => null,
            'est_actif' => true,
        ]);
        $this->upsertBillet($stagiaires['meryem'], $personnels['gestionnaire'], [
            'absence_id' => $absences['meryem_1']->id,
            'type' => 'absence',
            'code_unique' => 'BLT-MER-001',
            'qr_code' => 'QR-BLT-MER-001',
            'motif' => 'Ancien billet desactive.',
            'date_validite' => '2026-03-12 23:59:59',
            'duree_retard_minutes' => null,
            'est_actif' => false,
        ]);
        $this->upsertBillet($stagiaires['khadija'], $personnels['gestionnaire'], [
            'absence_id' => $absences['khadija_2']->id,
            'type' => 'retard',
            'code_unique' => 'BLT-KHA-001',
            'qr_code' => 'QR-BLT-KHA-001',
            'motif' => 'Billet valide pour retard justifie.',
            'date_validite' => '2026-04-16 23:59:59',
            'duree_retard_minutes' => 45,
            'est_actif' => true,
        ]);
        $this->upsertBillet($stagiaires['omar'], $personnels['gestionnaire'], [
            'absence_id' => $absences['omar_2']->id,
            'type' => 'absence',
            'code_unique' => 'BLT-OMA-001',
            'qr_code' => 'QR-BLT-OMA-001',
            'motif' => 'Billet expire conserve pour historique.',
            'date_validite' => '2026-04-05 23:59:59',
            'duree_retard_minutes' => null,
            'est_actif' => true,
        ]);

        $this->upsertNotification($stagiaires['yassine'], [
            'type_notif' => 'seuil_absences_depasse',
            'message' => 'Vous avez 3 absence(s) non justifiee(s). Le seuil de 3 a ete atteint.',
            'date_envoi' => '2026-04-10 18:00:00',
            'vu' => false,
        ]);
        $this->upsertNotification($stagiaires['yassine'], [
            'type_notif' => 'justificatif_refuse',
            'message' => 'Votre justificatif pour l\'absence #' . $absences['yassine_5']->id . ' a ete refuse. Motif: Document illisible et hors delai.',
            'date_envoi' => '2026-04-10 18:05:00',
            'vu' => false,
        ]);
        $this->upsertNotification($stagiaires['meryem'], [
            'type_notif' => 'seuil_absences_depasse',
            'message' => 'Vous avez 3 absence(s) non justifiee(s). Le seuil de 3 a ete atteint.',
            'date_envoi' => '2026-04-08 16:00:00',
            'vu' => true,
        ]);
        $this->upsertNotification($stagiaires['salma'], [
            'type_notif' => 'justificatif_en_attente',
            'message' => 'Votre justificatif pour l\'absence #' . $absences['salma_3']->id . ' est en attente de validation.',
            'date_envoi' => '2026-04-11 13:15:00',
            'vu' => false,
        ]);
        $this->upsertNotification($stagiaires['khadija'], [
            'type_notif' => 'billet_actif',
            'message' => 'Un billet actif #' . 'BLT-KHA-001' . ' est disponible pour votre retard justifie.',
            'date_envoi' => '2026-04-11 14:10:00',
            'vu' => false,
        ]);
        $this->upsertNotification($stagiaires['anas'], [
            'type_notif' => 'justificatif_en_attente',
            'message' => 'Le justificatif de l\'absence #' . $absences['anas_2']->id . ' est en cours d\'analyse.',
            'date_envoi' => '2026-04-14 11:25:00',
            'vu' => false,
        ]);

        $noteCalculationService = app(NoteCalculationService::class);

        foreach ($stagiaires as $stagiaire) {
            $noteCalculationService->calculateForStagiaire($stagiaire->fresh('groupe'));
        }
    }

    private function seedRoles(): array
    {
        $roles = [
            ['nom' => 'stagiaire', 'description' => 'Consulte ses absences et justificatifs'],
            ['nom' => 'formateur', 'description' => 'Saisit les absences et consulte les billets'],
            ['nom' => 'gestionnaire', 'description' => 'Administre les stagiaires, billets et justificatifs'],
            ['nom' => 'directeur', 'description' => 'Consulte les statistiques globales'],
            ['nom' => 'admin', 'description' => 'Administre les comptes sensibles et les resets internes'],
        ];

        $result = [];

        foreach ($roles as $roleData) {
            $role = Role::updateOrCreate(
                ['nom' => $roleData['nom']],
                ['description' => $roleData['description']]
            );

            $result[$roleData['nom']] = $role;
        }

        return $result;
    }

    private function upsertUser(string $name, string $email, int $roleId): User
    {
        return User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make('Password123!'),
                'role_id' => $roleId,
                'must_change_password' => false,
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
        return Groupe::updateOrCreate(
            ['nom' => $attributes['nom']],
            $attributes
        );
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
}
