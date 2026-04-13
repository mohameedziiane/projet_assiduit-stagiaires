<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('administrative_password_reset_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('requester_user_id')->nullable();
            $table->unsignedBigInteger('target_user_id')->nullable();
            $table->unsignedBigInteger('target_role_id')->nullable();
            $table->string('status', 20)->default('pending');
            $table->unsignedBigInteger('processed_by_user_id')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->text('refusal_reason')->nullable();
            $table->timestamps();

            $table->foreign('requester_user_id', 'apr_req_user_fk')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('target_user_id', 'apr_target_user_fk')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('target_role_id', 'apr_target_role_fk')
                ->references('id')
                ->on('roles')
                ->nullOnDelete();

            $table->foreign('processed_by_user_id', 'apr_proc_user_fk')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->index(['target_user_id', 'status'], 'admin_pwd_reset_target_status_idx');
            $table->index(['target_role_id', 'status'], 'admin_pwd_reset_role_status_idx');
            $table->index(['processed_by_user_id', 'status'], 'admin_pwd_reset_processor_status_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('administrative_password_reset_requests');
    }
};
