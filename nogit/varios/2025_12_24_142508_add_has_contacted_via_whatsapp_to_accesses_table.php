<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('accesses', function (Blueprint $table) {
            $table->boolean('hasContactedViaWhatsApp')
                ->nullable()
                ->after('rejected_guard_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('accesses', function (Blueprint $table) {
            $table->dropColumn('hasContactedViaWhatsApp');
        });
    }
};