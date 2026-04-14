<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('justificatifs')
            ->where('statut', 'valide')
            ->update(['statut' => 'accepte']);

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("
                ALTER TABLE justificatifs
                MODIFY statut ENUM('en_attente', 'accepte', 'refuse') NOT NULL DEFAULT 'en_attente'
            ");
        }

        Schema::table('justificatifs', function (Blueprint $table) {
            if (!Schema::hasColumn('justificatifs', 'reviewed_by')) {
                $table->foreignId('reviewed_by')
                    ->nullable()
                    ->after('motif_refus')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('justificatifs', 'reviewed_at')) {
                $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('justificatifs', function (Blueprint $table) {
            if (Schema::hasColumn('justificatifs', 'reviewed_by')) {
                $table->dropConstrainedForeignId('reviewed_by');
            }

            if (Schema::hasColumn('justificatifs', 'reviewed_at')) {
                $table->dropColumn('reviewed_at');
            }
        });

        DB::table('justificatifs')
            ->where('statut', 'accepte')
            ->update(['statut' => 'valide']);

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("
                ALTER TABLE justificatifs
                MODIFY statut ENUM('en_attente', 'valide', 'refuse') NOT NULL DEFAULT 'en_attente'
            ");
        }
    }
};
