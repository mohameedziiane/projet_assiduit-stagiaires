<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            $duplicateIds = DB::table('justificatifs')
                ->select('id')
                ->whereNotIn('id', function ($query) {
                    $query->from('justificatifs')
                        ->selectRaw('MIN(id)')
                        ->groupBy('absence_id');
                })
                ->pluck('id');

            if ($duplicateIds->isNotEmpty()) {
                DB::table('justificatifs')->whereIn('id', $duplicateIds)->delete();
            }

            $hasUniqueIndex = collect(DB::select("PRAGMA index_list('justificatifs')"))
                ->contains(fn ($index) => ($index->name ?? null) === 'justificatifs_absence_id_unique');
        } else {
            DB::statement('
                DELETE j1 FROM justificatifs j1
                INNER JOIN justificatifs j2
                    ON j1.absence_id = j2.absence_id
                   AND j1.id > j2.id
            ');

            $hasUniqueIndex = collect(DB::select('SHOW INDEX FROM justificatifs'))
                ->contains(fn ($index) => $index->Key_name === 'justificatifs_absence_id_unique');
        }

        if (!$hasUniqueIndex) {
            Schema::table('justificatifs', function (Blueprint $table) {
                $table->unique('absence_id');
            });
        }
    }

    public function down(): void
    {
        $hasUniqueIndex = DB::getDriverName() === 'sqlite'
            ? collect(DB::select("PRAGMA index_list('justificatifs')"))
                ->contains(fn ($index) => ($index->name ?? null) === 'justificatifs_absence_id_unique')
            : collect(DB::select('SHOW INDEX FROM justificatifs'))
                ->contains(fn ($index) => $index->Key_name === 'justificatifs_absence_id_unique');

        if ($hasUniqueIndex) {
            Schema::table('justificatifs', function (Blueprint $table) {
                $table->dropUnique(['absence_id']);
            });
        }
    }
};
