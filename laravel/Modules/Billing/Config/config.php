<?php

declare(strict_types=1);

return [
    'name' => 'Billing',
    'razorpay' => [
        'key' => env('RAZORPAY_KEY', env('RAZORPAY_KEY_ID')),
        'secret' => env('RAZORPAY_SECRET', env('RAZORPAY_KEY_SECRET')),
        'webhook_secret' => env('RAZORPAY_WEBHOOK_SECRET', env('RAZORPAY_SECRET', env('RAZORPAY_KEY_SECRET'))),
        'currency' => env('RAZORPAY_CURRENCY', 'INR'),
        'default_total_count' => (int) env('RAZORPAY_SUBSCRIPTION_TOTAL_COUNT', 12),
        'customer_notify' => (int) env('RAZORPAY_CUSTOMER_NOTIFY', 1),
    ],
];
