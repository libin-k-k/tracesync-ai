<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Modules\Tenant\Enums\SubscriptionPlan;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('api_key', 64)->unique();
            $table->string('subscription_plan')->default(SubscriptionPlan::Free->value);
            $table->timestamps();

            $table->index('subscription_plan');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
