<?php
// backend/api/auth/me.php

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../../config/api_header.php';
require_once __DIR__ . '/../../middleware/auth.php';

use Middleware\AuthMiddleware;
use Dotenv\Dotenv;

// Load environment variables
$dotenv = \Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
$dotenv->safeLoad();

// Authenticate the request
$decoded = AuthMiddleware::authenticate();

if ($decoded) {
    http_response_code(200);
    echo json_encode(array(
        "message" => "Accès autorisé.",
        "user" => $decoded->data
    ));
}