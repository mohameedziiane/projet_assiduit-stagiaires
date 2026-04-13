<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('status')
                ->default('active')
                ->after('must_change_password');
        });

        Schema::table('stagiaires', function (Blueprint $table) {
            $table->string('niveau')->nullable()->after('niveau_scolaire');
            $table->string('code_filiere')->nullable()->after('niveau');
            $table->string('filiere')->nullable()->after('code_filiere');
            $table->string('type_formation')->nullable()->after('filiere');
            $table->string('annee_etude')->nullable()->after('type_formation');
            $table->string('nationalite')
                ->default('Marocaine')
                ->after('annee_etude');
            $table->date('date_inscription')->nullable()->after('nationalite');
            $table->date('date_dossier_complet')->nullable()->after('date_inscription');
            $table->string('motif_admission')->nullable()->after('date_dossier_complet');
            $table->string('statut')
                ->default('actif')
                ->after('motif_admission');
        });
    }

    public function down(): void
    {
        Schema::table('stagiaires', function (Blueprint $table) {
            $table->dropColumn([
                'niveau',
                'code_filiere',
                'filiere',
                'type_formation',
                'annee_etude',
                'nationalite',
                'date_inscription',
                'date_dossier_complet',
                'motif_admission',
                'statut',
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
