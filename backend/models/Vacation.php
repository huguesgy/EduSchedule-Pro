<?php
// backend/models/Vacation.php

namespace App;

use PDO;

class Vacation
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function generateForMonth($enseignant_id, $mois, $annee, $matiere_id = null)
    {
        $stmt = $this->pdo->prepare("SELECT taux_horaire FROM enseignants WHERE id = ?");
        $stmt->execute([$enseignant_id]);
        $enseignant = $stmt->fetch();
        $taux = $enseignant['taux_horaire'] ?? 0;

        $sql = "SELECT s.id, s.heure_debut_reelle, s.heure_fin_reelle 
                FROM seances s
                JOIN emploi_temps et ON s.emploi_temps_id = et.id
                WHERE et.enseignant_id = ? 
                AND MONTH(s.date_seance) = ? 
                AND YEAR(s.date_seance) = ? 
                AND s.statut = 'termine'";

        $params = [$enseignant_id, $mois, $annee];
        if ($matiere_id) {
            $sql .= " AND et.matiere_id = ?";
            $params[] = $matiere_id;
        }

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $seances = $stmt->fetchAll();

        if (empty($seances)) {
            return false;
        }

        $sqlExisting = "SELECT id FROM vacations WHERE enseignant_id = ? AND mois = ? AND annee = ? AND (
                (matiere_id IS NULL AND ? IS NULL) OR matiere_id = ?
            ) LIMIT 1";
        $stmtExisting = $this->pdo->prepare($sqlExisting);
        $stmtExisting->execute([$enseignant_id, $mois, $annee, $matiere_id, $matiere_id]);
        $existing = $stmtExisting->fetch();

        if ($existing) {
            $this->pdo->prepare("DELETE FROM vacation_lignes WHERE id_vacation = ?")->execute([$existing['id']]);
            $this->pdo->prepare("DELETE FROM vacations WHERE id = ?")->execute([$existing['id']]);
        }

        $sqlHeader = "INSERT INTO vacations (enseignant_id, mois, annee, matiere_id, etat_validation) VALUES (?, ?, ?, ?, 'brouillon')";
        $this->pdo->prepare($sqlHeader)->execute([$enseignant_id, $mois, $annee, $matiere_id]);
        $vacation_id = $this->pdo->lastInsertId();

        $total_h = 0;
        $total_amount = 0;

        foreach ($seances as $s) {
            $start = strtotime($s['heure_debut_reelle']);
            $end = strtotime($s['heure_fin_reelle']);
            $duration = round(($end - $start) / 3600, 2);
            $amount = $duration * $taux;

            $sqlLine = "INSERT INTO vacation_lignes (id_vacation, id_creneau, duree_heures, taux, montant) VALUES (?, ?, ?, ?, ?)";
            $this->pdo->prepare($sqlLine)->execute([$vacation_id, $s['id'], $duration, $taux, $amount]);

            $total_h += $duration;
            $total_amount += $amount;
        }

        $this->pdo->prepare("UPDATE vacations SET nb_heures_total = ?, montant_total = ? WHERE id = ?")
            ->execute([$total_h, $total_amount, $vacation_id]);

        return $vacation_id;
    }

    public function getById($id)
    {
        $stmt = $this->pdo->prepare("SELECT * FROM vacations WHERE id = ?");
        $stmt->execute([$id]);
        $v = $stmt->fetch();
        if ($v) {
            $stmtLines = $this->pdo->prepare("SELECT * FROM vacation_lignes WHERE id_vacation = ?");
            $stmtLines->execute([$id]);
            $v['lignes'] = $stmtLines->fetchAll();
        }
        return $v;
    }

    public function validate($id, $next_state)
    {
        $stmt = $this->pdo->prepare("UPDATE vacations SET etat_validation = ? WHERE id = ?");
        return $stmt->execute([$next_state, $id]);
    }
}
