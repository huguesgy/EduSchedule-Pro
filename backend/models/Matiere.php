<?php
// backend/models/Matiere.php

namespace App;

use PDO;

class Matiere
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getAll()
    {
        $stmt = $this->pdo->prepare("SELECT * FROM matieres");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function create($code, $libelle, $vh_total)
    {
        $stmt = $this->pdo->prepare("INSERT INTO matieres (code, libelle, vh_total) VALUES (?, ?, ?)");
        return $stmt->execute([$code, $libelle, $vh_total]);
    }
}