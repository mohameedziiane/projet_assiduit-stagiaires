<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('billets', function (Blueprint $table) {
            if (!Schema::hasColumn('billets', 'justificatif_id')) {
                $table->foreignId('justificatif_id')
                    ->nullable()
                    ->after('absence_id')
                    ->constrained('justificatifs')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('billets', 'created_by')) {
                $table->foreignId('created_by')
                    ->nullable()
                    ->after('personnel_id')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('billets', 'heure_debut')) {
                $table->time('heure_debut')->nullable()->after('date_validite');
            }

            if (!Schema::hasColumn('billets', 'heure_fin')) {
                $table->time('heure_fin')->nullable()->after('heure_debut');
            }

            if (!Schema::hasColumn('billets', 'statut')) {
                $table->string('statut', 20)->default('actif')->after('heure_fin');
            }
        });
    }

    public function down(): void
    {
        Schema::table('billets', function (Blueprint $table) {
            if (Schema::hasColumn('billets', 'justificatif_id')) {
                $table->dropConstrainedForeignId('justificatif_id');
            }

            if (Schema::hasColumn('billets', 'created_by')) {
                $table->dropConstrainedForeignId('created_by');
            }

            if (Schema::hasColumn('billets', 'heure_debut')) {
                $table->dropColumn('heure_debut');
            }

            if (Schema::hasColumn('billets', 'heure_fin')) {
                $table->dropColumn('heure_fin');
            }

            if (Schema::hasColumn('billets', 'statut')) {
                $table->dropColumn('statut');
            }
        });
    }
};
