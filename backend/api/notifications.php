<?php
// backend/api/notifications.php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/api_header.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

use Middleware\AuthMiddleware;

$decoded = AuthMiddleware::authenticate();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;
$id = $_GET['id'] ?? null;
$userId = $decoded->data->id;
$userRole = $decoded->data->role;

switch ($method) {
    case 'GET':
        if ($action === 'count') {
            // Compteur de notifications non lues
            if (in_array($userRole, ['admin', 'surveillant'])) {
                $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM notifications WHERE lue = 0 AND (destinataire_id IS NULL OR destinataire_id = ?)");
            }
            else {
                $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM notifications WHERE lue = 0 AND destinataire_id = ?");
            }
            $stmt->execute([$userId]);
            echo json_encode($stmt->fetch());
            break;
        }

        // Liste des notifications
        if (in_array($userRole, ['admin', 'surveillant'])) {
            $stmt = $pdo->prepare("SELECT * FROM notifications WHERE destinataire_id IS NULL OR destinataire_id = ? ORDER BY created_at DESC LIMIT 50");
        }
        else {
            $stmt = $pdo->prepare("SELECT * FROM notifications WHERE destinataire_id = ? ORDER BY created_at DESC LIMIT 50");
        }
        $stmt->execute([$userId]);
        echo json_encode($stmt->fetchAll());
        break;

    case 'PUT':
        if ($action === 'read-all') {
            // Marquer toutes comme lues
            if (in_array($userRole, ['admin', 'surveillant'])) {
                $stmt = $pdo->prepare("UPDATE notifications SET lue = 1 WHERE (destinataire_id IS NULL OR destinataire_id = ?) AND lue = 0");
            }
            else {
                $stmt = $pdo->prepare("UPDATE notifications SET lue = 1 WHERE destinataire_id = ? AND lue = 0");
            }
            $stmt->execute([$userId]);
            echo json_encode(array("message" => "Toutes les notifications ont été marquées comme lues."));
            break;
        }

        if ($id) {
            // Marquer une notification comme lue
            $stmt = $pdo->prepare("UPDATE notifications SET lue = 1 WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(array("message" => "Notification lue."));
        }
        break;

    case 'POST':
        // Vérification alertes automatiques (appelé par un cron ou manuellement)
        if ($action === 'check-alerts' && in_array($userRole, ['admin', 'surveillant'])) {
            $alertsGenerated = 0;

            // 1. Alertes séances non pointées (>30 min après l'heure prévue)
            $sql = "SELECT s.id, et.heure_debut, m.libelle as matiere_nom, cl.nom as classe_nom,
                           u.nom as prof_nom, u.prenom as prof_prenom
                    FROM seances s
                    JOIN emploi_temps et ON s.emploi_temps_id = et.id
                    JOIN matieres m ON et.matiere_id = m.id
                    JOIN classes cl ON et.classe_id = cl.id
                    JOIN enseignants e ON et.enseignant_id = e.id
                    JOIN utilisateurs u ON e.user_id = u.id
                    WHERE s.date_seance = CURDATE() 
                    AND s.statut = 'planifie'
                    AND TIMESTAMPDIFF(MINUTE, CONCAT(CURDATE(), ' ', et.heure_debut), NOW()) > 30";
            $stmt = $pdo->query($sql);
            $lateSeances = $stmt->fetchAll();

            foreach ($lateSeances as $seance) {
                // Vérifier qu'on n'a pas déjà créé cette alerte
                $checkStmt = $pdo->prepare("SELECT COUNT(*) as c FROM notifications WHERE type = 'absence' AND message LIKE ? AND DATE(created_at) = CURDATE()");
                $checkStmt->execute(['%séance #' . $seance['id'] . '%']);
                if ($checkStmt->fetch()['c'] == 0) {
                    $stmt2 = $pdo->prepare("INSERT INTO notifications (destinataire_id, type, titre, message) VALUES (NULL, 'absence', ?, ?)");
                    $stmt2->execute([
                        'Absence détectée : ' . $seance['prof_prenom'] . ' ' . $seance['prof_nom'],
                        'La séance #' . $seance['id'] . ' de "' . $seance['matiere_nom'] . '" (' . $seance['classe_nom'] . ') prévue à ' . substr($seance['heure_debut'], 0, 5) . ' n\'a toujours pas été pointée (+30 min).'
                    ]);
                    $alertsGenerated++;
                }
            }

            // 2. Alertes cahiers non remplis (séances terminées sans cahier)
            $sql2 = "SELECT s.id, s.date_seance, m.libelle as matiere_nom, cl.nom as classe_nom
                     FROM seances s
                     JOIN emploi_temps et ON s.emploi_temps_id = et.id
                     JOIN matieres m ON et.matiere_id = m.id
                     JOIN classes cl ON et.classe_id = cl.id
                     LEFT JOIN cahier_texte ct ON ct.seance_id = s.id
                     WHERE s.statut = 'termine' AND ct.id IS NULL
                     AND s.date_seance >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
            $stmt = $pdo->query($sql2);
            $missingCahiers = $stmt->fetchAll();

            foreach ($missingCahiers as $mc) {
                $checkStmt = $pdo->prepare("SELECT COUNT(*) as c FROM notifications WHERE type = 'cahier_manquant' AND message LIKE ? AND DATE(created_at) = CURDATE()");
                $checkStmt->execute(['%séance #' . $mc['id'] . '%']);
                if ($checkStmt->fetch()['c'] == 0) {
                    $stmt2 = $pdo->prepare("INSERT INTO notifications (destinataire_id, type, titre, message) VALUES (NULL, 'cahier_manquant', ?, ?)");
                    $stmt2->execute([
                        'Cahier de texte manquant',
                        'La séance #' . $mc['id'] . ' de "' . $mc['matiere_nom'] . '" (' . $mc['classe_nom'] . ') du ' . $mc['date_seance'] . ' est terminée mais n\'a pas de cahier de texte.'
                    ]);
                    $alertsGenerated++;
                }
            }

            echo json_encode(array("message" => "$alertsGenerated alerte(s) générée(s).", "count" => $alertsGenerated));
            break;
        }

        http_response_code(400);
        echo json_encode(array("message" => "Action invalide."));
        break;
}