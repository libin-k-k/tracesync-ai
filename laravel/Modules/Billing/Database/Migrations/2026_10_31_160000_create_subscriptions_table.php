<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Modules\Billing\Enums\SubscriptionStatus;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')
                ->constrained('tenants')
                ->cascadeOnDelete();
            $table->string('razorpay_subscription_id')->unique();
            $table->string('razorpay_plan_id');
            $table->string('status')->default(SubscriptionStatus::Created->value);
            $table->timestamp('current_term_start')->nullable();
            $table->timestamp('current_term_end')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->index('razorpay_plan_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
