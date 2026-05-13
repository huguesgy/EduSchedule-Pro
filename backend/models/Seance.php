<?php
// backend/models/Seance.php

namespace App;

use PDO;

class Seance
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function findById($id)
    {
        $stmt = $this->pdo->prepare("SELECT * FROM seances WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function findByToken($token)
    {
        $stmt = $this->pdo->prepare("SELECT * FROM seances WHERE qr_token = ?");
        $stmt->execute([$token]);
        return $stmt->fetch();
    }

    public function updateQR($id, $token, $expire)
    {
        $stmt = $this->pdo->prepare("UPDATE seances SET qr_token = ?, qr_expire = ? WHERE id = ?");
        return $stmt->execute([$token, $expire, $id]);
    }

    public function validateScan($id)
    {
        $now = date('Y-m-d H:i:s');
        $stmt = $this->pdo->prepare("UPDATE seances SET heure_debut_reelle = ?, statut = 'en_cours' WHERE id = ?");
        return $stmt->execute([$now, $id]);
    }

    public function createPointageLog($seance_id, $ip, $status, $token = null, $lat = null, $lng = null)
    {
        $sql = "INSERT INTO pointages (id_creneau, heure_pointage_reelle, ip_source, latitude, longitude, token_utilise, statut) VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$seance_id, date('Y-m-d H:i:s'), $ip, $lat, $lng, $token, $status]);
    }
}
