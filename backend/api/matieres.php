<?php
// backend/api/matieres.php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/api_header.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../models/Matiere.php';

use App\Matiere;
use Middleware\AuthMiddleware;

$decoded = AuthMiddleware::authenticate();
$matiereModel = new Matiere($pdo);
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        echo json_encode($matiereModel->getAll());
        break;

    case 'POST':
        if ($decoded->data->role !== 'admin') {
            http_response_code(403);
            echo json_encode(array("message" => "Accès refusé."));
            break;
        }

        $data = json_decode(file_get_contents("php://input"));
        if (!empty($data->code) && !empty($data->libelle)) {
            if ($matiereModel->create($data->code, $data->libelle, $data->vh_total ?? 0)) {
                http_response_code(201);
                echo json_encode(array("message" => "Matière créée."));
            }
            else {
                http_response_code(500);
                echo json_encode(array("message" => "Erreur lors de la création."));
            }
        }
        else {
            http_response_code(400);
            echo json_encode(array("message" => "Code et libellé requis."));
        }
        break;
}