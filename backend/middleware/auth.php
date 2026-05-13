<?php
// backend/middleware/auth.php

namespace Middleware;

require_once __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class AuthMiddleware
{
    public static function authenticate()
    {
        $authHeader = null;

        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        }
        elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }
        else {
            $headers = getallheaders();
            // Log headers for debugging
            error_log("Headers reçus : " . json_encode($headers));
            
            if (isset($headers['Authorization'])) {
                $authHeader = $headers['Authorization'];
            }
            elseif (isset($headers['authorization'])) {
                $authHeader = $headers['authorization'];
            }
            // Bonus: Allow token in URL for downloads
            elseif (isset($_GET['token'])) {
                $authHeader = "Bearer " . $_GET['token'];
            }
        }

        if ($authHeader) {
            $arr = explode(" ", $authHeader);
            $jwt = $arr[1] ?? null;

            if ($jwt) {
                try {
                    $secret_key = $_ENV['JWT_SECRET'] ?? null;
                    if (!$secret_key) {
                        throw new Exception("Configuration serveur invalide (SECRET_KEY manquant).");
                    }
                    $decoded = JWT::decode($jwt, new Key($secret_key, 'HS256'));
                    return $decoded;
                }
                catch (Exception $e) {
                    http_response_code(401);
                    echo json_encode(array("message" => "Accès refusé. Token invalide.", "error" => $e->getMessage()));
                    exit();
                }
            }
        }

        http_response_code(401);
        echo json_encode(array("message" => "Accès refusé. Token manquant."));
        exit();
    }
}