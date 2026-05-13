<?php
// backend/api/admin.php
// API CRUD pour l'administration des entités (classes, matières, salles, enseignants, utilisateurs).
// Requis par le sujet (§ 4.1 — CRUD, § 6 — Architecture API REST).

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/api_header.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

use Middleware\AuthMiddleware;

$decoded = AuthMiddleware::authenticate();

// Seul l'admin peut accéder à ce endpoint
if ($decoded->data->role !== 'admin') {
    http_response_code(403);
    echo json_encode(array("message" => "Accès réservé à l'administrateur."));
    exit;
}

$entity = $_GET['entity'] ?? '';
$id = $_GET['id'] ?? null;
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"));

// Tables autorisées
$allowed = ['classes', 'matieres', 'salles', 'enseignants', 'utilisateurs'];
if (!in_array($entity, $allowed)) {
    http_response_code(400);
    echo json_encode(array("message" => "Entité non reconnue : $entity"));
    exit;
}

// ── GET — Lister ou récupérer un élément ──
if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM $entity WHERE id = ?");
        $stmt->execute([$id]);
        $item = $stmt->fetch();
        echo json_encode($item ?: []);
    }
    else {
        $stmt = $pdo->query("SELECT * FROM $entity ORDER BY id ASC");
        echo json_encode($stmt->fetchAll());
    }
    exit;
}

// ── POST — Créer un élément ──
if ($method === 'POST') {
    $fields = getFieldsForEntity($entity);
    $values = [];
    $placeholders = [];
    $params = [];

    foreach ($fields as $f) {
        $val = $data->$f ?? null;
        if ($entity === 'utilisateurs' && $f === 'mot_de_passe') {
            if (!empty($val)) {
                $val = password_hash($val, PASSWORD_BCRYPT);
            }
            else {
                continue; // skip empty password on create
            }
        }
        $values[] = $f;
        $placeholders[] = '?';
        $params[] = $val;
    }

    $sql = "INSERT INTO $entity (" . implode(',', $values) . ") VALUES (" . implode(',', $placeholders) . ")";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    http_response_code(201);
    echo json_encode(array("message" => "Élément créé.", "id" => $pdo->lastInsertId()));
    exit;
}

// ── PUT — Modifier un élément ──
if ($method === 'PUT') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(array("message" => "ID requis pour la modification."));
        exit;
    }

    $fields = getFieldsForEntity($entity);
    $sets = [];
    $params = [];

    foreach ($fields as $f) {
        $val = $data->$f ?? null;
        if ($entity === 'utilisateurs' && $f === 'mot_de_passe') {
            if (!empty($val)) {
                $val = password_hash($val, PASSWORD_BCRYPT);
            }
            else {
                continue; // ne pas écraser le mdp si vide
            }
        }
        if ($val !== null) {
            $sets[] = "$f = ?";
            $params[] = $val;
        }
    }

    if (empty($sets)) {
        http_response_code(400);
        echo json_encode(array("message" => "Aucune donnée à modifier."));
        exit;
    }

    $params[] = $id;
    $sql = "UPDATE $entity SET " . implode(', ', $sets) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(array("message" => "Élément modifié."));
    exit;
}

// ── DELETE — Supprimer un élément ──
if ($method === 'DELETE') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(array("message" => "ID requis pour la suppression."));
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM $entity WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(array("message" => "Élément supprimé."));
    exit;
}

/**
 * Retourne la liste des colonnes modifiables pour chaque entité.
 */
function getFieldsForEntity($entity)
{
    switch ($entity) {
        case 'classes':
            return ['nom', 'niveau', 'filiere'];
        case 'matieres':
            return ['libelle', 'code', 'volume_horaire'];
        case 'salles':
            return ['nom', 'capacite', 'batiment'];
        case 'enseignants':
            return ['user_id', 'specialite', 'taux_horaire'];
        case 'utilisateurs':
            return ['nom', 'prenom', 'email', 'role', 'mot_de_passe'];
        default:
            return [];
    }
}