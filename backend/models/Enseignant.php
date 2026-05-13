<?php
// backend/models/Enseignant.php

namespace App;

use PDO;

class Enseignant
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getAll()
    {
        $sql = "SELECT e.id, e.user_id, u.nom, u.prenom, u.email, e.specialite, e.statut, e.taux_horaire 
                FROM enseignants e 
                JOIN utilisateurs u ON e.user_id = u.id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function create($user_id, $specialite, $statut, $taux_horaire)
    {
        $sql = "INSERT INTO enseignants (user_id, specialite, statut, taux_horaire) VALUES (?, ?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$user_id, $specialite, $statut, $taux_horaire]);
    }
}