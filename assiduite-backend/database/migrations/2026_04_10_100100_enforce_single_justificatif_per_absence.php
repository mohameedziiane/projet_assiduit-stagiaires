<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('
            DELETE j1 FROM justificatifs j1
            INNER JOIN justificatifs j2
                ON j1.absence_id = j2.absence_id
               AND j1.id > j2.id
        ');

        $hasUniqueIndex = collect(DB::select('SHOW INDEX FROM justificatifs'))
            ->contains(fn ($index) => $index->Key_name === 'justificatifs_absence_id_unique');

        if (!$hasUniqueIndex) {
            Schema::table('justificatifs', function (Blueprint $table) {
                $table->unique('absence_id');
            });
        }
    }

    public function down(): void
    {
        $hasUniqueIndex = collect(DB::select('SHOW INDEX FROM justificatifs'))
            ->contains(fn ($index) => $index->Key_name === 'justificatifs_absence_id_unique');

        if ($hasUniqueIndex) {
            Schema::table('justificatifs', function (Blueprint $table) {
                $table->dropUnique(['absence_id']);
            });
        }
    }
};
