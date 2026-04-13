<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('groupes', function (Blueprint $table) {
            $table->string('code_filiere')->nullable()->after('filiere');
            $table->string('type_formation')->nullable()->after('code_filiere');
            $table->string('motif_admission')->nullable()->after('type_formation');
            $table->string('annee_formation')->nullable()->after('annee_scolaire');
        });

        Schema::table('stagiaires', function (Blueprint $table) {
            $table->string('numero_stagiaire')->nullable()->unique()->after('groupe_id');
            $table->string('cin')->nullable()->unique()->after('prenom');
            $table->string('genre')->nullable()->after('date_naissance');
            $table->string('niveau_scolaire')->nullable()->after('genre');
            $table->string('annee_bac')->nullable()->after('niveau_scolaire');
            $table->decimal('moyenne_bac', 5, 2)->nullable()->after('annee_bac');
        });

        Schema::table('absences', function (Blueprint $table) {
            $table->string('type_absence')->nullable()->after('seance_id');
        });

        Schema::table('billets', function (Blueprint $table) {
            $table->string('qr_code')->nullable()->after('code_unique');
        });
    }

    public function down(): void
    {
        Schema::table('billets', function (Blueprint $table) {
            $table->dropColumn('qr_code');
        });

        Schema::table('absences', function (Blueprint $table) {
            $table->dropColumn('type_absence');
        });

        Schema::table('stagiaires', function (Blueprint $table) {
            $table->dropUnique(['numero_stagiaire']);
            $table->dropUnique(['cin']);
            $table->dropColumn([
                'numero_stagiaire',
                'cin',
                'genre',
                'niveau_scolaire',
                'annee_bac',
                'moyenne_bac',
            ]);
        });

        Schema::table('groupes', function (Blueprint $table) {
            $table->dropColumn([
                'code_filiere',
                'type_formation',
                'motif_admission',
                'annee_formation',
            ]);
        });
    }
};
