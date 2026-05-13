<?php
// backend/api/seance_qr.php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/api_header.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../models/Seance.php';
require_once __DIR__ . '/../utils/QRHelper.php';

use App\Seance;
use Utils\QRHelper;

$seance_id = $_GET['id'] ?? null;

if (!$seance_id) {
    http_response_code(400);
    echo json_encode(array("message" => "id de séance requis."));
    exit;
}

$seanceModel = new Seance($pdo);
$seance = $seanceModel->findById($seance_id);

// Si l'ID passé est un ID d'emploi_temps (cas du premier lancement)
if (!$seance) {
    // Vérifier si c'est un emploi_temps_id
    $stmt = $pdo->prepare("SELECT id FROM seances WHERE emploi_temps_id = ? AND date_seance = CURRENT_DATE");
    $stmt->execute([$seance_id]);
    $existing = $stmt->fetch();

    if ($existing) {
        $seance_id = $existing['id'];
        $seance = $seanceModel->findById($seance_id);
    } else {
        // Créer la séance pour aujourd'hui
        $stmt = $pdo->prepare("INSERT INTO seances (emploi_temps_id, date_seance, statut) VALUES (?, CURRENT_DATE, 'planifie')");
        $stmt->execute([$seance_id]);
        $seance_id = $pdo->lastInsertId();
        $seance = $seanceModel->findById($seance_id);
    }
}

// Generate token if not exist or expired
if (empty($seance['qr_token']) || strtotime($seance['qr_expire']) < time()) {
    $token = QRHelper::generateToken($seance_id);
    $expire = date('Y-m-d H:i:s', time() + 1800); // 30 minutes validity
    $seanceModel->updateQR($seance_id, $token, $expire);
}
else {
    $token = $seance['qr_token'];
}

// Return SVG QR Code (or JSON with token info)
header("Content-Type: image/svg+xml");
echo QRHelper::generateImage($token);