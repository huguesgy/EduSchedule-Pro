<?php
// backend/api/stats.php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/api_header.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

use Middleware\AuthMiddleware;

$decoded = AuthMiddleware::authenticate();
$role = $decoded->data->role;
$userId = $decoded->data->id;

$stats = [];

// ——— Stats globales (pour admin et surveillant) ———
if (in_array($role, ['admin', 'surveillant'])) {
    // Total Classes
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM classes");
    $stats['total_classes'] = $stmt->fetch()['count'];

    // Total Enseignants
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM enseignants");
    $stats['total_enseignants'] = $stmt->fetch()['count'];

    // Séances en cours
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM seances WHERE statut = 'en_cours'");
    $stats['sessions_en_cours'] = $stmt->fetch()['count'];

    // Séances du jour
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM seances WHERE date_seance = CURDATE()");
    $stats['sessions_jour'] = $stmt->fetch()['count'];

    // Taux de présence du jour (séances pointées / séances planifiées)
    $stmt = $pdo->query("SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN statut IN ('en_cours', 'termine') THEN 1 ELSE 0 END) as pointees
        FROM seances WHERE date_seance = CURDATE()");
    $presence = $stmt->fetch();
    $stats['taux_presence'] = $presence['total'] > 0
        ? round(($presence['pointees'] / $presence['total']) * 100)
        : 0;

    // Budget vacation du mois
    $stmt = $pdo->query("SELECT COALESCE(SUM(montant_total), 0) as total FROM vacations WHERE mois = MONTH(CURRENT_DATE) AND annee = YEAR(CURRENT_DATE)");
    $stats['vacation_mois_courant'] = $stmt->fetch()['total'];

    // Cahiers en attente (séances terminées sans cahier clôturé)
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM seances s 
        LEFT JOIN cahier_texte ct ON ct.seance_id = s.id 
        WHERE s.statut = 'termine' AND (ct.id IS NULL OR ct.statut != 'cloture')
        AND s.date_seance >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)");
    $stats['cahiers_en_attente'] = $stmt->fetch()['count'];

    // Notifications non lues
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM notifications WHERE lue = 0 AND (destinataire_id IS NULL OR destinataire_id = ?)");
    $stmt->execute([$userId]);
    $stats['notifs_non_lues'] = $stmt->fetch()['count'];
}

// ——— Stats enseignant ———
if ($role === 'enseignant') {
    $stmtE = $pdo->prepare("SELECT id FROM enseignants WHERE user_id = ?");
    $stmtE->execute([$userId]);
    $ens = $stmtE->fetch();
    $ensId = $ens ? $ens['id'] : 0;

    // Mes séances cette semaine
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM seances s 
        JOIN emploi_temps et ON s.emploi_temps_id = et.id
        WHERE et.enseignant_id = ? AND YEARWEEK(s.date_seance, 1) = YEARWEEK(CURDATE(), 1)");
    $stmt->execute([$ensId]);
    $stats['mes_seances_semaine'] = $stmt->fetch()['count'];

    // Mes séances terminées ce mois
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM seances s 
        JOIN emploi_temps et ON s.emploi_temps_id = et.id
        WHERE et.enseignant_id = ? AND s.statut = 'termine' 
        AND MONTH(s.date_seance) = MONTH(CURDATE()) AND YEAR(s.date_seance) = YEAR(CURDATE())");
    $stmt->execute([$ensId]);
    $stats['sessions_terminees_mois'] = $stmt->fetch()['count'];

    // Mon montant de vacation ce mois
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(montant_total), 0) as total FROM vacations 
        WHERE enseignant_id = ? AND mois = MONTH(CURDATE()) AND annee = YEAR(CURDATE())");
    $stmt->execute([$ensId]);
    $stats['mon_total_vacation'] = $stmt->fetch()['total'];

    // Notifications
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM notifications WHERE lue = 0 AND destinataire_id = ?");
    $stmt->execute([$userId]);
    $stats['notifs_non_lues'] = $stmt->fetch()['count'];

    $stats['total_classes'] = 0;
    $stats['total_enseignants'] = 0;
    $stats['sessions_en_cours'] = $stats['mes_seances_semaine'];
    $stats['vacation_mois_courant'] = $stats['mon_total_vacation'];
}

// ——— Stats délégué ———
if ($role === 'delegue') {
    // Cahiers à remplir (séances en cours ou terminées sans cahier clôturé)
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM seances s 
        LEFT JOIN cahier_texte ct ON ct.seance_id = s.id
        WHERE s.statut IN ('en_cours', 'termine') AND (ct.id IS NULL OR ct.statut = 'brouillon')
        AND s.date_seance >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)");
    $stats['cahiers_a_remplir'] = $stmt->fetch()['count'];

    $stats['total_classes'] = 0;
    $stats['total_enseignants'] = 0;
    $stats['sessions_en_cours'] = 0;
    $stats['vacation_mois_courant'] = 0;

    // Notifications
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM notifications WHERE lue = 0 AND destinataire_id = ?");
    $stmt->execute([$userId]);
    $stats['notifs_non_lues'] = $stmt->fetch()['count'];
}

// ——— Chart Data (dernier 6 mois — tous rôles) ———
$chart_sql = "
    SELECT CONCAT(LPAD(mois, 2, '0'), '/', annee) as periode, SUM(montant_total) as montant
    FROM vacations
    WHERE (annee = YEAR(CURRENT_DATE) AND mois <= MONTH(CURRENT_DATE))
       OR (annee = YEAR(CURRENT_DATE) - 1 AND mois > MONTH(CURRENT_DATE))
    GROUP BY annee, mois
    ORDER BY annee ASC, mois ASC
    LIMIT 6
";
$stmt = $pdo->query($chart_sql);
$stats['chart_data'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($stats);