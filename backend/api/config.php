<?php
// backend/api/config.php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/api_header.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

use Middleware\AuthMiddleware;

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Public : permet au login de savoir s'il affiche les raccourcis
    $stmt = $pdo->query("SELECT valeur FROM system_config WHERE cle = 'debug_mode'");
    $val = $stmt->fetchColumn();
    echo json_encode(['debug_mode' => $val === '1']);
} 
elseif ($method === 'POST') {
    // Privé : Seul l'admin peut changer le mode
    $decoded = AuthMiddleware::authenticate();
    if ($decoded->data->role !== 'admin') {
        http_response_code(403);
        echo json_encode(['message' => 'Accès refusé']);
        exit;
    }

    $raw = file_get_contents("php://input");
    $data = json_decode($raw);
    
    if ($data === null && $raw !== "") {
        http_response_code(400);
        echo json_encode(['message' => 'JSON invalide']);
        exit;
    }

    $newVal = (isset($data->debug_mode) && $data->debug_mode) ? '1' : '0';
    
    $stmt = $pdo->prepare("UPDATE system_config SET valeur = ? WHERE cle = 'debug_mode'");
    $stmt->execute([$newVal]);
    
    echo json_encode([
        'message' => 'Configuration mise à jour', 
        'debug_mode' => $newVal === '1',
        'received' => $data
    ]);
}
