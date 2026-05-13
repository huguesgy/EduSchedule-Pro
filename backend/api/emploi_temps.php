<?php
// backend/api/emploi_temps.php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/api_header.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../models/EmploiTemps.php';

use App\EmploiTemps;
use Middleware\AuthMiddleware;

$decoded = AuthMiddleware::authenticate();
$etModel = new EmploiTemps($pdo);
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($action === 'check-conflicts') {
            // Vérification de conflits sans créer le créneau
            $enseignant_id = $_GET['enseignant_id'] ?? null;
            $salle_id = $_GET['salle_id'] ?? null;
            $jour = $_GET['jour'] ?? null;
            $heure_debut = $_GET['heure_debut'] ?? null;
            $heure_fin = $_GET['heure_fin'] ?? null;
            $exclude = $_GET['exclude_id'] ?? null;

            if (!$enseignant_id || !$salle_id || !$jour || !$heure_debut || !$heure_fin) {
                http_response_code(400);
                echo json_encode(array("message" => "Paramètres manquants pour la vérification."));
                break;
            }

            $conflicts = $etModel->checkConflicts($enseignant_id, $salle_id, $jour, $heure_debut, $heure_fin, $exclude);
            echo json_encode(array("conflicts" => $conflicts, "has_conflicts" => count($conflicts) > 0));
            break;
        }

        $classe_id = $_GET['id_classe'] ?? null;
        if ($classe_id) {
            echo json_encode($etModel->getByClasse($classe_id));
        }
        else {
            http_response_code(400);
            echo json_encode(array("message" => "id_classe requis."));
        }
        break;

    case 'POST':
        if ($decoded->data->role !== 'admin') {
            http_response_code(403);
            echo json_encode(array("message" => "Accès refusé. Rôle administrateur requis."));
            break;
        }

        $data = json_decode(file_get_contents("php://input"));
        if (!empty($data->classe_id) && !empty($data->matiere_id) && !empty($data->enseignant_id)) {
            // Détection automatique des conflits AVANT insertion
            $conflicts = $etModel->checkConflicts(
                $data->enseignant_id,
                $data->salle_id,
                $data->jour,
                $data->heure_debut,
                $data->heure_fin
            );

            if (!empty($conflicts)) {
                http_response_code(409);
                echo json_encode(array(
                    "message" => "Conflits détectés. Le créneau n'a pas été créé.",
                    "conflicts" => $conflicts
                ));
                break;
            }

            if ($etModel->create($data)) {
                http_response_code(201);
                echo json_encode(array("message" => "Créneau ajouté avec succès."));
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

    case 'DELETE':
        if ($decoded->data->role !== 'admin') {
            http_response_code(403);
            echo json_encode(array("message" => "Accès refusé."));
            break;
        }

        if ($id) {
            if ($etModel->delete($id)) {
                echo json_encode(array("message" => "Créneau supprimé."));
            }
            else {
                http_response_code(500);
                echo json_encode(array("message" => "Erreur lors de la suppression."));
            }
        }
        else {
            http_response_code(400);
            echo json_encode(array("message" => "ID requis."));
        }
        break;
}