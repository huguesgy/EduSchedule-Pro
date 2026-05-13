<?php
// backend/models/Classe.php

namespace App;

use PDO;

class Classe
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getAll()
    {
        $stmt = $this->pdo->prepare("SELECT * FROM classes");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function create($nom, $filiere, $niveau)
    {
        $stmt = $this->pdo->prepare("INSERT INTO classes (nom, filiere, niveau) VALUES (?, ?, ?)");
        return $stmt->execute([$nom, $filiere, $niveau]);
    }
}