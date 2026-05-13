<?php
// backend/models/CahierTexte.php

namespace App;

use PDO;

class CahierTexte
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function findBySeance($seance_id)
    {
        $stmt = $this->pdo->prepare("SELECT * FROM cahier_texte WHERE seance_id = ?");
        $stmt->execute([$seance_id]);
        return $stmt->fetch();
    }

    /**
     * Crée un nouveau brouillon de cahier de texte pour une séance.
     */
    public function create($data)
    {
        $sql = "INSERT INTO cahier_texte (seance_id, titre_cours, contenu, avancement, devoirs, observations, statut) VALUES (?, ?, ?, ?, ?, ?, 'brouillon')";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([
            $data->seance_id,
            $data->titre_cours,
            $data->contenu,
            $data->avancement ?? 0,
            $data->devoirs ?? '',
            $data->observations ?? ''
        ]);
    }

    /**
     * Met à jour le contenu d'un cahier de texte tant qu'il est en mode brouillon.
     */
    public function update($id, $data)
    {
        $sql = "UPDATE cahier_texte SET titre_cours = ?, contenu = ?, avancement = ?, devoirs = ?, observations = ? WHERE id = ? AND statut = 'brouillon'";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([
            $data->titre_cours,
            $data->contenu,
            $data->avancement,
            $data->devoirs,
            $data->observations,
            $id
        ]);
    }

    /**
     * Enregistre une signature numérique (Base64) et fait évoluer le statut du cahier.
     */
    public function addSignature($cahier_id, $user_id, $type, $signature_base64)
    {
        $sql = "INSERT INTO signatures (id_cahier, type_signataire, id_utilisateur, signature_base64) VALUES (?, ?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        $res = $stmt->execute([$cahier_id, $type, $user_id, $signature_base64]);

        if ($res && $type === 'delegue') {
            $this->pdo->prepare("UPDATE cahier_texte SET statut = 'signe_delegue', signature_delegue = ? WHERE id = ?")
                ->execute([$signature_base64, $cahier_id]);
        }

        if ($res && $type === 'enseignant') {
            $this->pdo->prepare("UPDATE cahier_texte SET signature_enseignant = ? WHERE id = ?")
                ->execute([$signature_base64, $cahier_id]);
        }
        return $res;
    }

    /**
     * Clôture définitivement le cahier de texte et marque la séance comme terminée.
     */
    public function cloturer($id, $user_id, $signature_base64, $heure_fin)
    {
        // Add teacher signature and close
        $res = $this->addSignature($id, $user_id, 'enseignant', $signature_base64);
        if ($res) {
            $sql = "UPDATE cahier_texte SET statut = 'cloture', date_cloture = NOW() WHERE id = ?";
            $this->pdo->prepare($sql)->execute([$id]);

            // Also update the seance end time
            $cahier = $this->getById($id);
            $this->pdo->prepare("UPDATE seances SET heure_fin_reelle = ?, statut = 'termine' WHERE id = ?")
                ->execute([$heure_fin, $cahier['seance_id']]);
        }
        return $res;
    }

    public function getById($id)
    {
        $stmt = $this->pdo->prepare("SELECT * FROM cahier_texte WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function getSignatures($id)
    {
        $stmt = $this->pdo->prepare("SELECT * FROM signatures WHERE id_cahier = ?");
        $stmt->execute([$id]);
        return $stmt->fetchAll();
    }
}
