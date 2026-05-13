<?php
// backend/api/cahiers.php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/api_header.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../models/CahierTexte.php';

use App\CahierTexte;
use Middleware\AuthMiddleware;

$decoded = AuthMiddleware::authenticate();
$cahierModel = new CahierTexte($pdo);
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($action === 'getBySeance') {
            $seance_id = $_GET['seance_id'] ?? null;
            $cahier = $cahierModel->findBySeance($seance_id);
            echo json_encode($cahier ?: (object)[]);
            break;
        }
        if ($id) {
            if ($action === 'pdf') {
                $cahier = $cahierModel->getById($id);
                if (!$cahier) {
                    http_response_code(404);
                    echo json_encode(array("message" => "Cahier non trouvé."));
                    break;
                }

                // Fetch extra info
                $stmt = $pdo->prepare("SELECT s.date_seance, s.heure_debut_reelle, s.heure_fin_reelle, m.libelle, cl.nom as classe_nom, u.nom as prof_nom, u.prenom as prof_prenom 
                                     FROM seances s 
                                     JOIN emploi_temps et ON s.emploi_temps_id = et.id 
                                     JOIN matieres m ON et.matiere_id = m.id 
                                     JOIN classes cl ON et.classe_id = cl.id
                                     JOIN enseignants e ON et.enseignant_id = e.id
                                     JOIN utilisateurs u ON e.user_id = u.id
                                     WHERE s.id = ?");
                $stmt->execute([$cahier['seance_id']]);
                $info = $stmt->fetch();

                // Generate HTML for mPDF
                $html = '
                <div style="font-family: sans-serif;">
                    <h1 style="text-align: center; color: #1B1464;">FICHE DE CAHIER DE TEXTE NUMÉRIQUE</h1>
                    <p style="text-align: center;">EduSchedule Pro - ITRST</p>
                    <hr>
                    <table style="width: 100%; margin-bottom: 20px;">
                        <tr>
                            <td><strong>Classe :</strong> ' . $info['classe_nom'] . '</td>
                            <td style="text-align: right;"><strong>Date :</strong> ' . $info['date_seance'] . '</td>
                        </tr>
                        <tr>
                            <td><strong>Enseignant :</strong> ' . $info['prof_prenom'] . ' ' . $info['prof_nom'] . '</td>
                            <td style="text-align: right;"><strong>Matière :</strong> ' . $info['libelle'] . '</td>
                        </tr>
                        <tr>
                            <td><strong>Heures :</strong> ' . date('H:i', strtotime($info['heure_debut_reelle'])) . ' - ' . ($info['heure_fin_reelle'] ? date('H:i', strtotime($info['heure_fin_reelle'])) : 'En cours') . '</td>
                            <td style="text-align: right;"><strong>Statut :</strong> ' . strtoupper($cahier['statut']) . '</td>
                        </tr>
                    </table>
                    
                    <h3>Contenu de la séance</h3>
                    <div style="border: 1px solid #ccc; padding: 15px; min-height: 100px; margin-bottom: 20px;">
                        <strong>Titre :</strong> ' . $cahier['titre_cours'] . '<br><br>
                        ' . nl2br($cahier['contenu']) . '
                    </div>

                    <h3>Détails Pédagogiques</h3>
                    <table style="width: 100%; border-collapse: collapse;" border="1">
                        <tr>
                            <td style="padding: 8px; width: 30%;"><strong>Avancement</strong></td>
                            <td style="padding: 8px;">' . $cahier['avancement'] . ' %</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px;"><strong>Devoirs</strong></td>
                            <td style="padding: 8px;">' . nl2br($cahier['devoirs']) . '</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px;"><strong>Observations</strong></td>
                            <td style="padding: 8px;">' . nl2br($cahier['observations']) . '</td>
                        </tr>
                    </table>

                    <div style="margin-top: 50px;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="width: 50%; text-align: center;">
                                    <strong>Signature Délégué</strong><br><br>
                                    ' . ($cahier['signature_delegue'] ? '<img src="' . $cahier['signature_delegue'] . '" style="width: 150px; height: auto;">' : '<br><br>_________________') . '
                                </td>
                                <td style="width: 50%; text-align: center;">
                                    <strong>Signature Enseignant</strong><br><br>
                                    ' . ($cahier['signature_enseignant'] ? '<img src="' . $cahier['signature_enseignant'] . '" style="width: 150px; height: auto;">' : '<br><br>_________________') . '
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>';

                $mpdf = new \Mpdf\Mpdf();
                $mpdf->WriteHTML($html);
                $mpdf->Output('cahier_texte_' . $id . '.pdf', \Mpdf\Output\Destination::INLINE);
                exit;
            }
            $cahier = $cahierModel->getById($id);
            if ($cahier) {
                $cahier['signatures'] = $cahierModel->getSignatures($id);
                echo json_encode($cahier);
            }
            else {
                http_response_code(404);
                echo json_encode(array("message" => "Cahier non trouvé."));
            }
        }
        else {
            // Add list logic if needed
            echo json_encode(array("message" => "Veuillez spécifier un ID."));
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));

        if ($action === 'signer') {
            if ($cahierModel->addSignature($id, $decoded->data->id, $data->type, $data->signature_base64)) {
                echo json_encode(array("message" => "Signature enregistrée."));
            }
            else {
                http_response_code(500);
                echo json_encode(array("message" => "Erreur lors de la signature."));
            }
            break;
        }

        if ($action === 'cloture') {
            if ($cahierModel->cloturer($id, $decoded->data->id, $data->signature_base64, $data->heure_fin)) {
                echo json_encode(array("message" => "Séance clôturée avec succès."));
            }
            else {
                http_response_code(500);
                echo json_encode(array("message" => "Erreur lors de la clôture."));
            }
            break;
        }

        // Default: Create
        if (!empty($data->seance_id)) {
            if ($cahierModel->create($data)) {
                http_response_code(201);
                echo json_encode(array("message" => "Cahier de texte initialisé."));
            }
            else {
                http_response_code(500);
                echo json_encode(array("message" => "Erreur lors de la création."));
            }
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        if ($cahierModel->update($id, $data)) {
            echo json_encode(array("message" => "Cahier mis à jour."));
        }
        else {
            http_response_code(500);
            echo json_encode(array("message" => "Erreur ou cahier déjà verrouillé."));
        }
        break;
}