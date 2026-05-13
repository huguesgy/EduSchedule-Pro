<?php
// backend/api/pointage_scan.php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/api_header.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../models/Seance.php';

use App\Seance;
use Middleware\AuthMiddleware;

/**
 * Pointage par Scan de QR Code
 * 
 * 1. Authentification du porteur (Enseignant/Admin)
 * 2. Récupération et validation du Token QR
 * 3. Vérification de la fenêtre temporelle (±15 min)
 * 4. Validation de la séance et enregistrement du pointage
 * 5. Déclenchement d'une alerte en cas de retard (> 5 min)
 */

$decoded = AuthMiddleware::authenticate();

// Check role
if ($decoded->data->role !== 'enseignant' && $decoded->data->role !== 'admin') {
    http_response_code(403);
    echo json_encode(array("message" => "Permissions insuffisantes. Rôle enseignant requis."));
    exit;
}

$data = json_decode(file_get_contents("php://input"));
$token_qr = $data->token_qr ?? null;
$lat = (isset($data->latitude) && is_numeric($data->latitude)) ? (float)$data->latitude : null;
$lng = (isset($data->longitude) && is_numeric($data->longitude)) ? (float)$data->longitude : null;

if (!$token_qr) {
    http_response_code(400);
    echo json_encode(array("message" => "Token QR requis."));
    exit;
}

$seanceModel = new Seance($pdo);
$seance = $seanceModel->findByToken($token_qr);

if (!$seance) {
    http_response_code(404);
    echo json_encode(array("message" => "QR Code invalide ou séance inexistante."));
    exit;
}

// Strict Time Validation (±15 min)
$sql = "SELECT heure_debut, heure_fin FROM emploi_temps WHERE id = ?";
$stmt = $pdo->prepare($sql);
$stmt->execute([$seance['emploi_temps_id']]);
$et = $stmt->fetch();

$scheduled_time = strtotime(date('Y-m-d') . ' ' . $et['heure_debut']);
$now = time();
$diff_minutes = ($now - $scheduled_time) / 60; // Signed difference (positive = late)
$abs_diff = abs($diff_minutes);

// Vérification du mode debug en base de données
$stmtDebug = $pdo->query("SELECT valeur FROM system_config WHERE cle = 'debug_mode'");
$is_test_mode = $stmtDebug->fetchColumn() === '1';

if ($abs_diff > 15 && !$is_test_mode) {
    http_response_code(403);
    echo json_encode(array("message" => "Pointage refusé. Vous devez scanner dans une fenêtre de ±15 min autour de l'heure prévue (" . $et['heure_debut'] . ")."));
    exit;
}

// Check expiration
if (strtotime($seance['qr_expire']) < time()) {
    http_response_code(410);
    echo json_encode(array("message" => "QR Code expiré."));
    exit;
}

// Check if already pointed
if ($seance['statut'] === 'en_cours' || $seance['statut'] === 'termine') {
    http_response_code(409);
    echo json_encode(array("message" => "La séance a déjà été pointée ou est terminée."));
    exit;
}

// Success: Point presence
$ip = $_SERVER['REMOTE_ADDR'];
if ($seanceModel->validateScan($seance['id'])) {
    $seanceModel->createPointageLog($seance['id'], $ip, 'success', $token_qr, $lat, $lng);

    // ========================================================
    // ALERTE AUTOMATIQUE : Retard détecté (> 5 min)
    // ========================================================
    if ($diff_minutes > 5) {
        $retard_min = round($diff_minutes);

        // Récupérer les infos de la séance pour l'alerte
        $sqlInfo = "SELECT m.libelle as matiere_nom, cl.nom as classe_nom, u.nom as prof_nom, u.prenom as prof_prenom
                    FROM emploi_temps et
                    JOIN matieres m ON et.matiere_id = m.id
                    JOIN classes cl ON et.classe_id = cl.id
                    JOIN enseignants e ON et.enseignant_id = e.id
                    JOIN utilisateurs u ON e.user_id = u.id
                    WHERE et.id = ?";
        $stmtInfo = $pdo->prepare($sqlInfo);
        $stmtInfo->execute([$seance['emploi_temps_id']]);
        $info = $stmtInfo->fetch();

        // Notification pour admin/surveillant (destinataire_id = NULL)
        $notifSql = "INSERT INTO notifications (destinataire_id, type, titre, message) VALUES (NULL, 'retard', ?, ?)";
        $pdo->prepare($notifSql)->execute([
            'Retard : ' . $info['prof_prenom'] . ' ' . $info['prof_nom'] . ' (+' . $retard_min . ' min)',
            'Le Prof. ' . $info['prof_prenom'] . ' ' . $info['prof_nom'] . ' a pointé avec ' . $retard_min . ' min de retard pour la séance de "' . $info['matiere_nom'] . '" (' . $info['classe_nom'] . ') prévue à ' . substr($et['heure_debut'], 0, 5) . '.'
        ]);
    }

    // Log d'activité
    $logSql = "INSERT INTO logs_activite (id_utilisateur, action, details_json, ip) VALUES (?, 'pointage_qr', ?, ?)";
    $pdo->prepare($logSql)->execute([
        $decoded->data->id,
        json_encode(['seance_id' => $seance['id'], 'retard_min' => round($diff_minutes)]),
        $ip
    ]);

    http_response_code(200);
    echo json_encode(array(
        "message" => "Pointage réussi !",
        "seance" => array(
            "id" => $seance['id'],
            "heure_debut" => date('H:i:s'),
            "retard_minutes" => max(0, round($diff_minutes))
        )
    ));
}
else {
    http_response_code(500);
    echo json_encode(array("message" => "Erreur lors de la validation du pointage."));
}