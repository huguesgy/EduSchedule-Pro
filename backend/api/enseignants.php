<?php
// backend/api/enseignants.php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/api_header.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../models/Enseignant.php';

use App\Enseignant;
use Middleware\AuthMiddleware;

$decoded = AuthMiddleware::authenticate();
$enseignantModel = new Enseignant($pdo);
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        echo json_encode($enseignantModel->getAll());
        break;

    case 'POST':
        if ($decoded->data->role !== 'admin') {
            http_response_code(403);
            echo json_encode(array("message" => "Accès refusé."));
            break;
        }

        $data = json_decode(file_get_contents("php://input"));
        if (!empty($data->user_id)) {
            if ($enseignantModel->create($data->user_id, $data->specialite ?? '', $data->statut ?? 'vacataire', $data->taux_horaire ?? 0)) {
                http_response_code(201);
                echo json_encode(array("message" => "Enseignant créé."));
            }
            else {
                http_response_code(500);
                echo json_encode(array("message" => "Erreur lors de la création."));
            }
        }
        else {
            http_response_code(400);
            echo json_encode(array("message" => "user_id requis."));
        }
        break;
}