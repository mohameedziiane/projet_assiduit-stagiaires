<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stagiaire_id')->constrained('stagiaires')->onDelete('cascade');
            $table->decimal('note_assiduite', 5, 2)->default(0);
            $table->decimal('note_discipline', 5, 2)->default(0);
            $table->date('date_calcul');
            $table->string('annee_formation')->nullable();
            $table->timestamps();

            $table->unique(['stagiaire_id', 'date_calcul']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notes');
    }
};
