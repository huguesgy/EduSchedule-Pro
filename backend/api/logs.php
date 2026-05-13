<?php
// backend/api/logs.php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/api_header.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

use Middleware\AuthMiddleware;

$decoded = AuthMiddleware::authenticate();

// Seul l'admin peut consulter les logs
if ($decoded->data->role !== 'admin') {
    http_response_code(403);
    echo json_encode(array("message" => "Accès refusé."));
    exit;
}

$action_filter = $_GET['action'] ?? null;
$date_debut = $_GET['date_debut'] ?? null;
$date_fin = $_GET['date_fin'] ?? null;

$sql = "SELECT l.*, u.nom, u.prenom, u.role 
        FROM logs_activite l 
        LEFT JOIN utilisateurs u ON l.id_utilisateur = u.id 
        WHERE 1=1";
$params = [];

if ($action_filter) {
    $sql .= " AND l.action = ?";
    $params[] = $action_filter;
}
if ($date_debut) {
    $sql .= " AND DATE(l.date_heure) >= ?";
    $params[] = $date_debut;
}
if ($date_fin) {
    $sql .= " AND DATE(l.date_heure) <= ?";
    $params[] = $date_fin;
}

$sql .= " ORDER BY l.date_heure DESC LIMIT 100";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
echo json_encode($stmt->fetchAll());