<?php
// backend/api/auth/login.php

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../../config/api_header.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../models/User.php';

use App\User;
use Firebase\JWT\JWT;
use Dotenv\Dotenv;

$userModel = new User($pdo);

// Get posted data
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->email) && !empty($data->password)) {
    $email = filter_var($data->email, FILTER_VALIDATE_EMAIL);
    if (!$email) {
        http_response_code(400);
        echo json_encode(array("message" => "Format d'email invalide."));
        exit();
    }

    $user = $userModel->findByEmail($email);

    if ($user && password_verify($data->password, $user['mot_de_passe'])) {
        $secret_key = $_ENV['JWT_SECRET'] ?? null;
        if (!$secret_key) {
            http_response_code(500);
            echo json_encode(array("message" => "Erreur de configuration serveur."));
            exit();
        }
        $issuer_claim = "eduschedule_pro";
        $audience_claim = "eduschedule_users";
        $issuedat_claim = time();
        $notbefore_claim = $issuedat_claim;
        $expire_claim = $issuedat_claim + (int)($_ENV['JWT_EXPIRATION'] ?? 3600);

        $token = array(
            "iss" => $issuer_claim,
            "aud" => $audience_claim,
            "iat" => $issuedat_claim,
            "nbf" => $notbefore_claim,
            "exp" => $expire_claim,
            "data" => array(
                "id" => $user['id'],
                "nom" => $user['nom'],
                "prenom" => $user['prenom'],
                "email" => $user['email'],
                "role" => $user['role']
            )
        );

        $jwt = JWT::encode($token, $secret_key, 'HS256');

        http_response_code(200);
        echo json_encode(array(
            "message" => "Connexion réussie.",
            "jwt" => $jwt,
            "user" => array(
                "id" => $user['id'],
                "nom" => $user['nom'],
                "prenom" => $user['prenom'],
                "role" => $user['role']
            )
        ));
    }
    else {
        http_response_code(401);
        echo json_encode(array("message" => "Email ou mot de passe incorrect."));
    }
}
else {
    http_response_code(400);
    echo json_encode(array("message" => "Données incomplètes."));
}