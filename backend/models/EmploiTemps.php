<?php
// backend/models/EmploiTemps.php

namespace App;

use PDO;

class EmploiTemps
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getByClasse($classe_id)
    {
        $sql = "SELECT et.*, m.libelle as matiere_nom, u.nom as enseignant_nom, u.prenom as enseignant_prenom,
                       s.nom as salle_nom,
                       se.id as seance_id, se.statut as seance_statut,
                       CASE et.jour 
                         WHEN 1 THEN 'Lundi' WHEN 2 THEN 'Mardi' WHEN 3 THEN 'Mercredi' 
                         WHEN 4 THEN 'Jeudi' WHEN 5 THEN 'Vendredi' WHEN 6 THEN 'Samedi' 
                       END as jour_nom
                FROM emploi_temps et
                JOIN matieres m ON et.matiere_id = m.id
                JOIN enseignants e ON et.enseignant_id = e.id
                JOIN utilisateurs u ON e.user_id = u.id
                JOIN salles s ON et.salle_id = s.id
                LEFT JOIN seances se ON se.id = (SELECT id FROM seances WHERE emploi_temps_id = et.id AND date_seance = CURRENT_DATE LIMIT 1)
                WHERE et.classe_id = ?
                ORDER BY et.jour ASC, et.heure_debut ASC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$classe_id]);
        return $stmt->fetchAll();
    }

    /**
     * Détection automatique des conflits avant création d'un créneau.
     * Vérifie : enseignant déjà occupé, salle déjà prise.
     * Retourne un tableau de conflits (vide = pas de conflit).
     */
    public function checkConflicts($enseignant_id, $salle_id, $jour, $heure_debut, $heure_fin, $exclude_id = null)
    {
        $conflicts = [];

        // 1. Conflit enseignant — même enseignant, même jour, chevauchement horaire
        $sql = "SELECT et.id, m.libelle as matiere_nom, et.heure_debut, et.heure_fin,
                       cl.nom as classe_nom
                FROM emploi_temps et
                JOIN matieres m ON et.matiere_id = m.id
                JOIN classes cl ON et.classe_id = cl.id
                WHERE et.enseignant_id = ? AND et.jour = ?
                AND et.heure_debut < ? AND et.heure_fin > ?";
        $params = [$enseignant_id, $jour, $heure_fin, $heure_debut];

        if ($exclude_id) {
            $sql .= " AND et.id != ?";
            $params[] = $exclude_id;
        }

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $teacherConflicts = $stmt->fetchAll();

        foreach ($teacherConflicts as $c) {
            $conflicts[] = [
                'type' => 'enseignant',
                'message' => "Conflit enseignant : déjà affecté à \"" . $c['matiere_nom'] . "\" (" . $c['classe_nom'] . ") de " . substr($c['heure_debut'], 0, 5) . " à " . substr($c['heure_fin'], 0, 5) . "."
            ];
        }

        // 2. Conflit salle — même salle, même jour, chevauchement horaire
        $sql2 = "SELECT et.id, m.libelle as matiere_nom, et.heure_debut, et.heure_fin,
                        cl.nom as classe_nom
                 FROM emploi_temps et
                 JOIN matieres m ON et.matiere_id = m.id
                 JOIN classes cl ON et.classe_id = cl.id
                 WHERE et.salle_id = ? AND et.jour = ?
                 AND et.heure_debut < ? AND et.heure_fin > ?";
        $params2 = [$salle_id, $jour, $heure_fin, $heure_debut];

        if ($exclude_id) {
            $sql2 .= " AND et.id != ?";
            $params2[] = $exclude_id;
        }

        $stmt2 = $this->pdo->prepare($sql2);
        $stmt2->execute($params2);
        $roomConflicts = $stmt2->fetchAll();

        foreach ($roomConflicts as $c) {
            $conflicts[] = [
                'type' => 'salle',
                'message' => "Conflit salle : déjà occupée par \"" . $c['matiere_nom'] . "\" (" . $c['classe_nom'] . ") de " . substr($c['heure_debut'], 0, 5) . " à " . substr($c['heure_fin'], 0, 5) . "."
            ];
        }

        return $conflicts;
    }

    public function create($data)
    {
        $sql = "INSERT INTO emploi_temps (classe_id, matiere_id, enseignant_id, salle_id, jour, heure_debut, heure_fin, type_seance, groupe) 
                VALUES (:classe_id, :matiere_id, :enseignant_id, :salle_id, :jour, :heure_debut, :heure_fin, :type_seance, :groupe)";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([
            ':classe_id' => $data->classe_id,
            ':matiere_id' => $data->matiere_id,
            ':enseignant_id' => $data->enseignant_id,
            ':salle_id' => $data->salle_id,
            ':jour' => $data->jour,
            ':heure_debut' => $data->heure_debut,
            ':heure_fin' => $data->heure_fin,
            ':type_seance' => $data->type_seance ?? 'Cours',
            ':groupe' => $data->groupe ?? NULL
        ]);
    }

    public function delete($id)
    {
        $stmt = $this->pdo->prepare("DELETE FROM emploi_temps WHERE id = ?");
        return $stmt->execute([$id]);
    }

    /**
     * Récupérer les salles disponibles pour un créneau donné.
     */
    public function getAvailableRooms($jour, $heure_debut, $heure_fin, $exclude_id = null)
    {
        $sql = "SELECT s.* FROM salles s
                WHERE s.id NOT IN (
                    SELECT et.salle_id FROM emploi_temps et
                    WHERE et.jour = ? AND et.heure_debut < ? AND et.heure_fin > ?";
        $params = [$jour, $heure_fin, $heure_debut];

        if ($exclude_id) {
            $sql .= " AND et.id != ?";
            $params[] = $exclude_id;
        }

        $sql .= ")";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
}