<?php
header('Content-Type: application/json');

$result = array(
    'php_version'  => PHP_VERSION,
    'curl_enabled' => function_exists('curl_init'),
    'getallheaders_builtin' => function_exists('getallheaders'),
    'curl_test'    => null,
    'curl_error'   => null,
);

// Test a simple cURL request to Render
if (function_exists('curl_init')) {
    $ch = curl_init('https://digiscribedev2026.onrender.com/api/admin/users');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_NOBODY, true); // HEAD only
    $raw = curl_exec($ch);
    $result['curl_test']  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $result['curl_error'] = curl_error($ch) ?: null;
    curl_close($ch);
}

echo json_encode($result, JSON_PRETTY_PRINT);
