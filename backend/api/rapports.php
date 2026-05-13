<?php
// backend/api/rapports.php
// API de génération de rapports PDF : présence, avancement, vacations, emploi du temps.
// Requis par le sujet (§ 4.1 — Export PDF emploi du temps, § 8.1 — RapportsPage).

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

use Mpdf\Mpdf;
use Middleware\AuthMiddleware;

$decoded = AuthMiddleware::authenticate();

$allowedRoles = ['admin', 'surveillant', 'comptable', 'enseignant'];
if (!in_array($decoded->data->role, $allowedRoles)) {
    http_response_code(403);
    echo json_encode(array("message" => "Accès refusé."));
    exit;
}

$type = $_GET['type'] ?? '';
$mois = $_GET['mois'] ?? date('m');
$annee = $_GET['annee'] ?? date('Y');
$classe_id = $_GET['classe_id'] ?? null;

$mpdf = new Mpdf([
    'margin_left' => 15,
    'margin_right' => 15,
    'margin_top' => 15,
    'margin_bottom' => 15,
]);

$mpdf->SetTitle('EduSchedule Pro - Rapport');
$mpdf->SetAuthor('EduSchedule Pro');

$moisNoms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
$moisNom = $moisNoms[(int)$mois] ?? '';

// ── CSS commun pour les rapports ──
$css = '
<style>
    body { font-family: Arial, sans-serif; font-size: 11pt; color: #222; }
    h1 { font-size: 18pt; color: #1a1a1a; border-bottom: 3px solid #ffd84d; padding-bottom: 8px; }
    h2 { font-size: 14pt; color: #333; margin-top: 20px; }
    .header-info { background: #f7f1df; padding: 12px; border: 2px solid #111; margin-bottom: 20px; }
    .header-info p { margin: 3px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #ffd84d; border: 2px solid #111; padding: 8px; text-transform: uppercase; font-size: 9pt; }
    td { border: 1px solid #999; padding: 6px 8px; }
    tr:nth-child(even) { background: #fafafa; }
    .total-row { background: #ffd84d !important; font-weight: bold; }
    .footer { text-align: center; font-size: 8pt; color: #999; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 8px; }
</style>';

switch ($type) {

    // ────────────────────────────────────────────────────────────────────────
    // RAPPORT DE PRÉSENCE
    // ────────────────────────────────────────────────────────────────────────
    case 'presence':
        $sql = "SELECT 
                    u.nom, u.prenom,
                    COUNT(s.id) as total_seances,
                    SUM(CASE WHEN s.statut IN ('en_cours', 'termine') THEN 1 ELSE 0 END) as pointees,
                    SUM(CASE WHEN s.statut = 'planifie' THEN 1 ELSE 0 END) as non_pointees
                FROM seances s
                JOIN emploi_temps et ON s.emploi_temps_id = et.id
                JOIN enseignants e ON et.enseignant_id = e.id
                JOIN utilisateurs u ON e.user_id = u.id
                WHERE MONTH(s.date_seance) = ? AND YEAR(s.date_seance) = ?";
        $params = [$mois, $annee];
        if ($classe_id) {
            $sql .= " AND et.classe_id = ?";
            $params[] = $classe_id;
        }
        $sql .= " GROUP BY u.id ORDER BY u.nom";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $html = $css;
        $html .= '<h1>📊 Rapport de Présence</h1>';
        $html .= '<div class="header-info">';
        $html .= "<p><strong>Période :</strong> $moisNom $annee</p>";
        $html .= "<p><strong>Généré par :</strong> {$decoded->data->prenom} {$decoded->data->nom}</p>";
        $html .= "<p><strong>Date :</strong> " . date('d/m/Y H:i') . "</p>";
        $html .= '</div>';

        $html .= '<table><thead><tr><th>Enseignant</th><th>Total séances</th><th>Pointées</th><th>Non pointées</th><th>Taux (%)</th></tr></thead><tbody>';

        $totalS = 0;
        $totalP = 0;
        foreach ($rows as $r) {
            $taux = $r['total_seances'] > 0 ? round(($r['pointees'] / $r['total_seances']) * 100) : 0;
            $html .= "<tr><td>{$r['nom']} {$r['prenom']}</td><td>{$r['total_seances']}</td><td>{$r['pointees']}</td><td>{$r['non_pointees']}</td><td>{$taux}%</td></tr>";
            $totalS += $r['total_seances'];
            $totalP += $r['pointees'];
        }
        $totalTaux = $totalS > 0 ? round(($totalP / $totalS) * 100) : 0;
        $html .= "<tr class='total-row'><td>TOTAL</td><td>$totalS</td><td>$totalP</td><td>" . ($totalS - $totalP) . "</td><td>{$totalTaux}%</td></tr>";
        $html .= '</tbody></table>';
        $html .= '<div class="footer">EduSchedule Pro — Rapport généré automatiquement</div>';
        $mpdf->WriteHTML($html);
        break;

    // ────────────────────────────────────────────────────────────────────────
    // RAPPORT D'AVANCEMENT
    // ────────────────────────────────────────────────────────────────────────
    case 'avancement':
        $sql = "SELECT m.libelle as matiere, c.nom as classe, 
                    AVG(ct.avancement) as avancement_moyen,
                    COUNT(ct.id) as nb_cahiers,
                    SUM(CASE WHEN ct.statut = 'cloture' THEN 1 ELSE 0 END) as nb_clotures
                FROM cahier_texte ct
                JOIN seances s ON ct.seance_id = s.id
                JOIN emploi_temps et ON s.emploi_temps_id = et.id
                JOIN matieres m ON et.matiere_id = m.id
                JOIN classes c ON et.classe_id = c.id
                WHERE MONTH(s.date_seance) = ? AND YEAR(s.date_seance) = ?";
        $params = [$mois, $annee];
        if ($classe_id) {
            $sql .= " AND et.classe_id = ?";
            $params[] = $classe_id;
        }
        $sql .= " GROUP BY m.id, c.id ORDER BY c.nom, m.libelle";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $html = $css;
        $html .= '<h1>📝 Rapport d\'Avancement du Programme</h1>';
        $html .= '<div class="header-info">';
        $html .= "<p><strong>Période :</strong> $moisNom $annee</p>";
        $html .= "<p><strong>Généré par :</strong> {$decoded->data->prenom} {$decoded->data->nom}</p>";
        $html .= "<p><strong>Date :</strong> " . date('d/m/Y H:i') . "</p>";
        $html .= '</div>';

        $html .= '<table><thead><tr><th>Classe</th><th>Matière</th><th>Cahiers</th><th>Clôturés</th><th>Avancement moyen</th></tr></thead><tbody>';
        foreach ($rows as $r) {
            $avg = round($r['avancement_moyen']);
            $html .= "<tr><td>{$r['classe']}</td><td>{$r['matiere']}</td><td>{$r['nb_cahiers']}</td><td>{$r['nb_clotures']}</td><td>{$avg}%</td></tr>";
        }
        $html .= '</tbody></table>';
        $html .= '<div class="footer">EduSchedule Pro — Rapport généré automatiquement</div>';
        $mpdf->WriteHTML($html);
        break;

    // ────────────────────────────────────────────────────────────────────────
    // SYNTHÈSE DES VACATIONS
    // ────────────────────────────────────────────────────────────────────────
    case 'vacations':
        $sql = "SELECT u.nom, u.prenom, v.mois, v.annee, v.nb_heures_total, v.montant_total, v.etat_validation
                FROM vacations v
                JOIN enseignants e ON v.enseignant_id = e.id
                JOIN utilisateurs u ON e.user_id = u.id
                WHERE v.mois = ? AND v.annee = ?
                ORDER BY u.nom";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$mois, $annee]);
        $rows = $stmt->fetchAll();

        $html = $css;
        $html .= '<h1>💰 Synthèse des Vacations</h1>';
        $html .= '<div class="header-info">';
        $html .= "<p><strong>Période :</strong> $moisNom $annee</p>";
        $html .= "<p><strong>Généré par :</strong> {$decoded->data->prenom} {$decoded->data->nom}</p>";
        $html .= "<p><strong>Date :</strong> " . date('d/m/Y H:i') . "</p>";
        $html .= '</div>';

        $html .= '<table><thead><tr><th>Enseignant</th><th>Heures</th><th>Montant (FCFA)</th><th>Statut</th></tr></thead><tbody>';
        $totalH = 0;
        $totalM = 0;
        foreach ($rows as $r) {
            $html .= "<tr><td>{$r['nom']} {$r['prenom']}</td><td>{$r['nb_heures_total']}h</td><td>" . number_format($r['montant_total'], 0, ',', ' ') . "</td><td>{$r['etat_validation']}</td></tr>";
            $totalH += $r['nb_heures_total'];
            $totalM += $r['montant_total'];
        }
        $html .= "<tr class='total-row'><td>TOTAL</td><td>{$totalH}h</td><td>" . number_format($totalM, 0, ',', ' ') . "</td><td>-</td></tr>";
        $html .= '</tbody></table>';
        $html .= '<div class="footer">EduSchedule Pro — Rapport généré automatiquement</div>';
        $mpdf->WriteHTML($html);
        break;

    // ────────────────────────────────────────────────────────────────────────
    // EXPORT PDF EMPLOI DU TEMPS
    // ────────────────────────────────────────────────────────────────────────
    case 'emploi_temps':
        if (!$classe_id) {
            http_response_code(400);
            echo json_encode(array("message" => "Veuillez sélectionner une classe."));
            exit;
        }

        // Nom de la classe
        $stmtC = $pdo->prepare("SELECT nom FROM classes WHERE id = ?");
        $stmtC->execute([$classe_id]);
        $classeNom = $stmtC->fetchColumn() ?: 'Classe inconnue';

        // Créneaux
        $sql = "SELECT et.jour, et.heure_debut, et.heure_fin, et.type_seance, et.groupe,
                       m.libelle as matiere, s.nom as salle,
                       u.nom as prof_nom, u.prenom as prof_prenom
                FROM emploi_temps et
                JOIN matieres m ON et.matiere_id = m.id
                JOIN enseignants e ON et.enseignant_id = e.id
                JOIN utilisateurs u ON e.user_id = u.id
                JOIN salles s ON et.salle_id = s.id
                WHERE et.classe_id = ?
                ORDER BY et.jour, et.heure_debut";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$classe_id]);
        $rows = $stmt->fetchAll();

        $jours = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

        // Organiser par jour
        $byDay = [];
        foreach ($rows as $r) {
            $byDay[$r['jour']][] = $r;
        }

        $mpdf->AddPage('L'); // Paysage pour l'emploi du temps

        $html = $css;
        $html .= "<h1>📅 Emploi du Temps — $classeNom</h1>";
        $html .= '<div class="header-info">';
        $html .= "<p><strong>Classe :</strong> $classeNom</p>";
        $html .= "<p><strong>Période :</strong> Semaine du 04 au 09 Mai 2026</p>";
        $html .= '</div>';

        $html .= '<table><thead><tr><th>Jour</th><th>Horaire</th><th>Matière</th><th>Type</th><th>Enseignant</th><th>Salle</th><th>Groupe</th></tr></thead><tbody>';
        for ($d = 1; $d <= 6; $d++) {
            if (!isset($byDay[$d]))
                continue;
            $first = true;
            foreach ($byDay[$d] as $r) {
                $jourLabel = $first ? $jours[$d] : '';
                $isDS = $r['type_seance'] === 'DS';
                $style = $isDS ? 'style="background-color: #e0e0e0; font-weight: bold;"' : '';
                
                $html .= "<tr $style>";
                $html .= "<td><strong>$jourLabel</strong></td>";
                $html .= "<td><strong>[" . substr($r['heure_debut'], 0, 5) . " - " . substr($r['heure_fin'], 0, 5) . "]</strong></td>";
                $html .= "<td>{$r['matiere']}</td>";
                $html .= "<td>{$r['type_seance']}</td>";
                $html .= "<td>{$r['prof_prenom']} {$r['prof_nom']}</td>";
                $html .= "<td>{$r['salle']}</td>";
                $html .= "<td>" . ($r['groupe'] ?: '-') . "</td>";
                $html .= "</tr>";
                $first = false;
            }
        }
        $html .= '</tbody></table>';
        $html .= '<div class="footer">EduSchedule Pro — Emploi du temps généré automatiquement</div>';
        $mpdf->WriteHTML($html);
        break;

    default:
        http_response_code(400);
        echo json_encode(array("message" => "Type de rapport non reconnu : $type"));
        exit;
}

$mpdf->Output("rapport_{$type}_{$moisNom}_{$annee}.pdf", \Mpdf\Output\Destination::INLINE);