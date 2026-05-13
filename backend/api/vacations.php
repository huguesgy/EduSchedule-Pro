<?php
// backend/api/vacations.php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/api_header.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../models/Vacation.php';

use App\Vacation;
use Middleware\AuthMiddleware;

function getEnseignantIdForUser(PDO $pdo, int $userId): ?int
{
    $stmt = $pdo->prepare("SELECT id FROM enseignants WHERE user_id = ?");
    $stmt->execute([$userId]);
    $result = $stmt->fetch();

    return $result ? (int)$result['id'] : null;
}

$decoded = AuthMiddleware::authenticate();

// Contrôle d'accès par rôle (RBAC) — seuls ces rôles accèdent aux vacations
$allowedRoles = ['admin', 'enseignant', 'surveillant', 'comptable'];
if (!in_array($decoded->data->role, $allowedRoles)) {
    http_response_code(403);
    echo json_encode(array("message" => "Accès refusé. Votre rôle (" . $decoded->data->role . ") ne permet pas d'accéder aux vacations."));
    exit;
}

$vacationModel = new Vacation($pdo);
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;

switch ($method) {
    case 'GET':
        if ($action === 'list') {
            if ($decoded->data->role === 'enseignant') {
                $enseignantId = getEnseignantIdForUser($pdo, (int)$decoded->data->id);

                if (!$enseignantId) {
                    http_response_code(404);
                    echo json_encode(array("message" => "Profil enseignant introuvable."));
                    break;
                }

                $stmt = $pdo->prepare("SELECT * FROM vacations WHERE enseignant_id = ? ORDER BY annee DESC, mois DESC");
                $stmt->execute([$enseignantId]);
                echo json_encode($stmt->fetchAll());
                break;
            }

            $stmt = $pdo->query("SELECT * FROM vacations ORDER BY annee DESC, mois DESC");
            echo json_encode($stmt->fetchAll());
            break;
        }

        if ($id) {
            if ($action === 'pdf') {
                $vacation = $vacationModel->getById($id);
                if (!$vacation) {
                    http_response_code(404);
                    echo json_encode(array("message" => "Vacation non trouvée."));
                    break;
                }

                // Fetch extra info
                $stmt = $pdo->prepare("SELECT u.nom, u.prenom FROM enseignants e JOIN utilisateurs u ON e.user_id = u.id WHERE e.id = ?");
                $stmt->execute([$vacation['enseignant_id']]);
                $prof = $stmt->fetch();

                $matiere = ['libelle' => 'Toutes'];
                if ($vacation['matiere_id']) {
                    $stmt = $pdo->prepare("SELECT libelle FROM matieres WHERE id = ?");
                    $stmt->execute([$vacation['matiere_id']]);
                    $matiere = $stmt->fetch();
                }

                // Generate HTML for mPDF
                $html = '
                <div style="font-family: sans-serif;">
                    <h1 style="text-align: center; color: #1B1464;">FICHE DE VACATION MENSUELLE</h1>
                    <p style="text-align: center;">EduSchedule Pro - ITRST</p>
                    <hr>
                    <table style="width: 100%; margin-bottom: 20px;">
                        <tr>
                            <td><strong>Enseignant :</strong> ' . $prof['prenom'] . ' ' . $prof['nom'] . '</td>
                            <td style="text-align: right;"><strong>Période :</strong> ' . $vacation['mois'] . '/' . $vacation['annee'] . '</td>
                        </tr>
                        <tr>
                            <td><strong>Matière :</strong> ' . $matiere['libelle'] . '</td>
                            <td style="text-align: right;"><strong>Statut :</strong> ' . strtoupper($vacation['etat_validation']) . '</td>
                        </tr>
                    </table>
                    
                    <table style="width: 100%; border-collapse: collapse;" border="1">
                        <thead>
                            <tr style="background: #f2f2f2;">
                                <th style="padding: 8px;">Date / Séance</th>
                                <th style="padding: 8px;">Durée (h)</th>
                                <th style="padding: 8px;">Taux (FCFA)</th>
                                <th style="padding: 8px;">Montant (FCFA)</th>
                            </tr>
                        </thead>
                        <tbody>';

                foreach ($vacation['lignes'] as $line) {
                    $stmt = $pdo->prepare("SELECT s.date_seance, m.libelle FROM seances s JOIN emploi_temps et ON s.emploi_temps_id = et.id JOIN matieres m ON et.matiere_id = m.id WHERE s.id = ?");
                    $stmt->execute([$line['id_creneau']]);
                    $s = $stmt->fetch();

                    $html .= '
                            <tr>
                                <td style="padding: 8px;">' . $s['date_seance'] . ' - ' . $s['libelle'] . '</td>
                                <td style="padding: 8px; text-align: center;">' . $line['duree_heures'] . '</td>
                                <td style="padding: 8px; text-align: right;">' . number_format($line['taux'], 0, ',', ' ') . '</td>
                                <td style="padding: 8px; text-align: right;">' . number_format($line['montant'], 0, ',', ' ') . '</td>
                            </tr>';
                }

                $html .= '
                        </tbody>
                        <tfoot>
                            <tr style="background: #f2f2f2; font-weight: bold;">
                                <td style="padding: 8px; text-align: right;">TOTAL</td>
                                <td style="padding: 8px; text-align: center;">' . $vacation['nb_heures_total'] . ' h</td>
                                <td></td>
                                <td style="padding: 8px; text-align: right;">' . number_format($vacation['montant_total'], 0, ',', ' ') . ' FCFA</td>
                            </tr>
                        </tfoot>
                    </table>
                    
                    <div style="margin-top: 50px;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="width: 33%; text-align: center;">Signature Enseignant<br><br><br>_________________</td>
                                <td style="width: 33%; text-align: center;">Visa Surveillant<br><br><br>_________________</td>
                                <td style="width: 33%; text-align: center;">Validation Comptable<br><br><br>_________________</td>
                            </tr>
                        </table>
                    </div>
                </div>';

                $mpdf = new \Mpdf\Mpdf();
                $mpdf->WriteHTML($html);
                $mpdf->Output('vacation_' . $vacation['mois'] . '_' . $vacation['annee'] . '.pdf', \Mpdf\Output\Destination::INLINE);
                exit;
            }
            echo json_encode($vacationModel->getById($id));
        }
        else {
            http_response_code(400);
            echo json_encode(array("message" => "Veuillez spécifier un ID."));
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));

        if ($action === 'generer') {
            if (!in_array($decoded->data->role, array('admin', 'surveillant', 'enseignant'), true)) {
                http_response_code(403);
                echo json_encode(array("message" => "Non autorisé."));
                break;
            }

            $enseignantId = null;

            if ($decoded->data->role === 'enseignant') {
                $enseignantId = getEnseignantIdForUser($pdo, (int)$decoded->data->id);
            }
            elseif (!empty($data->enseignant_id)) {
                $enseignantId = (int)$data->enseignant_id;
            }

            if (!$enseignantId || empty($data->mois) || empty($data->annee)) {
                http_response_code(400);
                echo json_encode(array("message" => "enseignant_id, mois et annee sont requis."));
                break;
            }

            $vid = $vacationModel->generateForMonth(
                $enseignantId,
                (int)$data->mois,
                (int)$data->annee,
                $data->matiere_id ?? null
            );

            if ($vid) {
                http_response_code(201);
                echo json_encode(array("message" => "Fiche de vacation générée.", "id" => $vid));
            }
            else {
                http_response_code(404);
                echo json_encode(array("message" => "Aucune séance terminée trouvée pour cette période."));
            }
            break;
        }

        if ($action === 'valider') {
            if (!in_array($decoded->data->role, array('admin', 'surveillant', 'comptable'), true)) {
                http_response_code(403);
                echo json_encode(array("message" => "Non autorisé."));
                break;
            }

            if (!$id || empty($data->etat)) {
                http_response_code(400);
                echo json_encode(array("message" => "ID et nouvel etat requis."));
                break;
            }

            if ($vacationModel->validate($id, $data->etat)) {
                echo json_encode(array("message" => "Statut mis à jour."));
            }
            else {
                http_response_code(500);
                echo json_encode(array("message" => "Erreur lors de la mise à jour du statut."));
            }
            break;
        }

        http_response_code(400);
        echo json_encode(array("message" => "Action invalide."));
        break;
}