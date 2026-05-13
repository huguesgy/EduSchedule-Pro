<?php
// backend/api/salles.php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/api_header.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

use Middleware\AuthMiddleware;

$decoded = AuthMiddleware::authenticate();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM salles ORDER BY nom ASC");
        echo json_encode($stmt->fetchAll());
        break;

    case 'POST':
        if ($decoded->data->role !== 'admin') {
            http_response_code(403);
            echo json_encode(array("message" => "Accès refusé."));
            break;
        }

        $data = json_decode(file_get_contents("php://input"));
        if (!empty($data->nom)) {
            $stmt = $pdo->prepare("INSERT INTO salles (nom, capacite, equipements, batiment) VALUES (?, ?, ?, ?)");
            if ($stmt->execute([$data->nom, $data->capacite ?? 0, $data->equipements ?? '', $data->batiment ?? ''])) {
                http_response_code(201);
                echo json_encode(array("message" => "Salle créée."));
            }
            else {
                http_response_code(500);
                echo json_encode(array("message" => "Erreur lors de la création."));
            }
        }
        else {
            http_response_code(400);
            echo json_encode(array("message" => "Le nom de la salle est requis."));
        }
        break;
}