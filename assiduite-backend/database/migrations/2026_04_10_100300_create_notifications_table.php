<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('notifications')) {
            return;
        }

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stagiaire_id')->constrained('stagiaires')->onDelete('cascade');
            $table->string('type_notif');
            $table->text('message');
            $table->timestamp('date_envoi')->useCurrent();
            $table->boolean('vu')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('notifications')) {
            Schema::drop('notifications');
        }
    }
};
