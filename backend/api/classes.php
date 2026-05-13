<?php
// backend/api/classes.php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/api_header.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../models/Classe.php';

use App\Classe;
use Middleware\AuthMiddleware;

// Authenticate (anyone logged in can see classes, but only admin can create)
$decoded = AuthMiddleware::authenticate();

$classeModel = new Classe($pdo);
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $classes = $classeModel->getAll();
        echo json_encode($classes);
        break;

    case 'POST':
        // Only admin can create
        if ($decoded->data->role !== 'admin') {
            http_response_code(403);
            echo json_encode(array("message" => "Accès refusé. Rôle administrateur requis."));
            break;
        }

        $data = json_decode(file_get_contents("php://input"));
        if (!empty($data->nom)) {
            if ($classeModel->create($data->nom, $data->filiere ?? '', $data->niveau ?? '')) {
                http_response_code(201);
                echo json_encode(array("message" => "Classe créée avec succès."));
            }
            else {
                http_response_code(500);
                echo json_encode(array("message" => "Erreur lors de la création."));
            }
        }
        else {
            http_response_code(400);
            echo json_encode(array("message" => "Données incomplètes."));
        }
        break;
}