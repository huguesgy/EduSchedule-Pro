-- ===============================================================
-- Script SQL pour EduSchedule Pro
-- Version 3.0 — Données complètes pour démo soutenance
-- ISGE-BF — Année Universitaire 2025-2026
-- ===============================================================

CREATE DATABASE IF NOT EXISTS eduschedule_db;
USE eduschedule_db;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS validations;
DROP TABLE IF EXISTS travaux_demandes;
DROP TABLE IF EXISTS logs_activite;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS pointages;
DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS vacation_lignes;
DROP TABLE IF EXISTS vacations;
DROP TABLE IF EXISTS cahier_texte;
DROP TABLE IF EXISTS seances;
DROP TABLE IF EXISTS emploi_temps;
DROP TABLE IF EXISTS salles;
DROP TABLE IF EXISTS matieres;
DROP TABLE IF EXISTS enseignants;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS utilisateurs;
SET FOREIGN_KEY_CHECKS = 1;

-- ===============================================================
-- 0. Table de configuration systeme
-- ===============================================================
CREATE TABLE system_config (
    cle VARCHAR(50) PRIMARY KEY,
    valeur VARCHAR(255)
);
INSERT INTO system_config (cle, valeur) VALUES ('debug_mode', '0');

-- ===============================================================
-- 1. Table des utilisateurs
-- ===============================================================
CREATE TABLE utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role ENUM('admin', 'enseignant', 'delegue', 'surveillant', 'comptable', 'etudiant') NOT NULL,
    actif TINYINT(1) DEFAULT 1,
    token_reset VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================================
-- 2. Table des classes
-- ===============================================================
CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    filiere VARCHAR(100),
    niveau VARCHAR(20),
    annee_academique VARCHAR(10) DEFAULT '2025-2026'
);

-- ===============================================================
-- 3. Table des matieres
-- ===============================================================
CREATE TABLE matieres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    libelle VARCHAR(100) NOT NULL,
    vh_total INT NOT NULL,
    coefficient DECIMAL(3,1) DEFAULT 1.0
);

-- ===============================================================
-- 4. Table des salles
-- ===============================================================
CREATE TABLE salles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    capacite INT DEFAULT 0,
    equipements VARCHAR(255) DEFAULT NULL,
    batiment VARCHAR(50) DEFAULT NULL
);

-- ===============================================================
-- 5. Table des enseignants
-- ===============================================================
CREATE TABLE enseignants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    specialite VARCHAR(100),
    statut ENUM('vacataire', 'permanent') DEFAULT 'vacataire',
    taux_horaire DECIMAL(10, 2) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- ===============================================================
-- 6. Table de l'emploi du temps
-- ===============================================================
CREATE TABLE emploi_temps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    classe_id INT NOT NULL,
    matiere_id INT NOT NULL,
    enseignant_id INT NOT NULL,
    salle_id INT NOT NULL,
    jour INT NOT NULL COMMENT '1=Lundi ... 6=Samedi',
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    type_seance ENUM('Cours', 'TD', 'TP', 'DS') DEFAULT 'Cours',
    groupe VARCHAR(20) DEFAULT NULL,
    FOREIGN KEY (classe_id) REFERENCES classes(id),
    FOREIGN KEY (matiere_id) REFERENCES matieres(id),
    FOREIGN KEY (enseignant_id) REFERENCES enseignants(id),
    FOREIGN KEY (salle_id) REFERENCES salles(id)
);

-- ===============================================================
-- 7. Table des seances
-- ===============================================================
CREATE TABLE seances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    emploi_temps_id INT NOT NULL,
    date_seance DATE NOT NULL,
    qr_token VARCHAR(255) UNIQUE DEFAULT NULL,
    qr_expire DATETIME DEFAULT NULL,
    heure_debut_reelle DATETIME DEFAULT NULL,
    heure_fin_reelle DATETIME DEFAULT NULL,
    statut ENUM('planifie', 'en_cours', 'termine', 'annule') DEFAULT 'planifie',
    FOREIGN KEY (emploi_temps_id) REFERENCES emploi_temps(id) ON DELETE CASCADE
);

-- ===============================================================
-- 8. Table du cahier de texte
-- ===============================================================
CREATE TABLE cahier_texte (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seance_id INT NOT NULL,
    titre_cours VARCHAR(255) DEFAULT NULL,
    contenu TEXT,
    objectifs TEXT DEFAULT NULL,
    supports VARCHAR(255) DEFAULT NULL,
    avancement INT DEFAULT 0,
    devoirs TEXT DEFAULT NULL,
    observations TEXT DEFAULT NULL,
    statut ENUM('brouillon', 'signe_delegue', 'cloture') DEFAULT 'brouillon',
    signature_enseignant LONGTEXT DEFAULT NULL,
    signature_delegue LONGTEXT DEFAULT NULL,
    date_cloture TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (seance_id) REFERENCES seances(id) ON DELETE CASCADE
);

-- ===============================================================
-- 9. Table des signatures
-- ===============================================================
CREATE TABLE signatures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_cahier INT NOT NULL,
    type_signataire ENUM('delegue', 'enseignant') NOT NULL,
    id_utilisateur INT NOT NULL,
    signature_base64 LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cahier) REFERENCES cahier_texte(id) ON DELETE CASCADE,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- ===============================================================
-- 10. Table des pointages
-- ===============================================================
CREATE TABLE pointages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_creneau INT NOT NULL,
    heure_pointage_reelle DATETIME NOT NULL,
    ip_source VARCHAR(45) DEFAULT NULL,
    latitude DECIMAL(10, 8) DEFAULT NULL,
    longitude DECIMAL(11, 8) DEFAULT NULL,
    token_utilise VARCHAR(255) DEFAULT NULL,
    statut VARCHAR(20) NOT NULL,
    FOREIGN KEY (id_creneau) REFERENCES seances(id) ON DELETE CASCADE
);

-- ===============================================================
-- 11. Table des vacations
-- ===============================================================
CREATE TABLE vacations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enseignant_id INT NOT NULL,
    mois INT NOT NULL,
    annee INT NOT NULL,
    matiere_id INT DEFAULT NULL,
    nb_heures_total DECIMAL(6, 2) DEFAULT 0,
    montant_total DECIMAL(10, 2) DEFAULT 0,
    etat_validation ENUM('brouillon', 'valide_surveillant', 'approuve_comptable', 'paye') DEFAULT 'brouillon',
    commentaire_refus TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enseignant_id) REFERENCES enseignants(id),
    FOREIGN KEY (matiere_id) REFERENCES matieres(id)
);

-- ===============================================================
-- 12. Lignes de vacation
-- ===============================================================
CREATE TABLE vacation_lignes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_vacation INT NOT NULL,
    id_creneau INT NOT NULL,
    duree_heures DECIMAL(6, 2) NOT NULL,
    taux DECIMAL(10, 2) NOT NULL,
    montant DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (id_vacation) REFERENCES vacations(id) ON DELETE CASCADE,
    FOREIGN KEY (id_creneau) REFERENCES seances(id) ON DELETE CASCADE
);

-- ===============================================================
-- 13. Table des notifications (alertes temps réel)
-- ===============================================================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    destinataire_id INT DEFAULT NULL COMMENT 'NULL = notification globale (admin/surveillant)',
    type ENUM('retard', 'absence', 'cahier_manquant', 'conflit', 'vacation', 'systeme') NOT NULL,
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    lue TINYINT(1) DEFAULT 0,
    lien VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (destinataire_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- ===============================================================
-- 14. Journal d'audit complet
-- ===============================================================
CREATE TABLE logs_activite (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur INT DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    details_json TEXT DEFAULT NULL,
    ip VARCHAR(45) DEFAULT NULL,
    date_heure TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id) ON DELETE SET NULL
);


-- ===============================================================
-- 15. Table des travaux demandés (devoirs — décorrélés du cahier de texte)
-- ===============================================================
CREATE TABLE travaux_demandes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cahier_id INT NOT NULL,
    type ENUM('exercice', 'devoir', 'projet', 'preparation') DEFAULT 'devoir',
    description TEXT NOT NULL,
    date_echeance DATE DEFAULT NULL,
    statut ENUM('en_cours', 'termine') DEFAULT 'en_cours',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cahier_id) REFERENCES cahier_texte(id) ON DELETE CASCADE
);

-- ===============================================================
-- 16. Table de la chaîne de validations (vacations — workflow)
-- ===============================================================
CREATE TABLE validations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vacation_id INT NOT NULL,
    etape ENUM('surveillant', 'comptable', 'directeur') NOT NULL,
    valideur_id INT NOT NULL,
    decision ENUM('approuve', 'refuse') NOT NULL,
    commentaire TEXT DEFAULT NULL,
    visa_base64 TEXT DEFAULT NULL COMMENT 'Signature numérique du valideur',
    date_validation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vacation_id) REFERENCES vacations(id) ON DELETE CASCADE,
    FOREIGN KEY (valideur_id) REFERENCES utilisateurs(id)
);

-- ===============================================================
-- DONNÉES DE DÉMONSTRATION
-- Mot de passe pour tous : "password" (hash bcrypt)
-- ===============================================================

-- Utilisateurs (11 comptes : 1 admin, 5 enseignants, 2 délégués, 1 surveillant, 1 comptable, 1 étudiant)
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role) VALUES
('ADMIN', 'Système', 'admin@itrst.bf', '$2y$12$lvSnL0TZUEkjBkalcpdGwOQ19klE5DUarjHwI7S5WbxzsDhU6afmS', 'admin'),
('TRAORE', 'Ali', 'prof1@itrst.bf', '$2y$12$lvSnL0TZUEkjBkalcpdGwOQ19klE5DUarjHwI7S5WbxzsDhU6afmS', 'enseignant'),
('KABORE', 'Fatimata', 'prof2@itrst.bf', '$2y$12$lvSnL0TZUEkjBkalcpdGwOQ19klE5DUarjHwI7S5WbxzsDhU6afmS', 'enseignant'),
('SAWADOGO', 'Ibrahim', 'prof3@itrst.bf', '$2y$12$lvSnL0TZUEkjBkalcpdGwOQ19klE5DUarjHwI7S5WbxzsDhU6afmS', 'enseignant'),
('CONGO', 'Aminata', 'prof4@itrst.bf', '$2y$12$lvSnL0TZUEkjBkalcpdGwOQ19klE5DUarjHwI7S5WbxzsDhU6afmS', 'enseignant'),
('ILBOUDO', 'Patrick', 'prof5@itrst.bf', '$2y$12$lvSnL0TZUEkjBkalcpdGwOQ19klE5DUarjHwI7S5WbxzsDhU6afmS', 'enseignant'),
('OUEDRAOGO', 'Sali', 'delegue1@itrst.bf', '$2y$12$lvSnL0TZUEkjBkalcpdGwOQ19klE5DUarjHwI7S5WbxzsDhU6afmS', 'delegue'),
('COMPAORE', 'Adama', 'delegue2@itrst.bf', '$2y$12$lvSnL0TZUEkjBkalcpdGwOQ19klE5DUarjHwI7S5WbxzsDhU6afmS', 'delegue'),
('ZONGO', 'Jean', 'surveillant@itrst.bf', '$2y$12$lvSnL0TZUEkjBkalcpdGwOQ19klE5DUarjHwI7S5WbxzsDhU6afmS', 'surveillant'),
('DIALLO', 'Moussa', 'comptable@itrst.bf', '$2y$12$lvSnL0TZUEkjBkalcpdGwOQ19klE5DUarjHwI7S5WbxzsDhU6afmS', 'comptable'),
('SOME', 'Boukary', 'etudiant@itrst.bf', '$2y$12$lvSnL0TZUEkjBkalcpdGwOQ19klE5DUarjHwI7S5WbxzsDhU6afmS', 'etudiant');

-- Classes (3 classes comme demandé)
INSERT INTO classes (nom, filiere, niveau) VALUES
('L1-RST', 'Réseaux et Systèmes de Télécommunications', 'Licence 1'),
('L2-RST', 'Réseaux et Systèmes de Télécommunications', 'Licence 2'),
('L3-RST', 'Réseaux et Systèmes de Télécommunications', 'Licence 3');

-- Matières réelles 1ATC-A
INSERT INTO matieres (code, libelle, vh_total, coefficient) VALUES
('ALG2', 'Algèbre 2', 45, 3.0),
('ELEC_P', 'Électronique de puissance 1', 30, 2.5),
('EMAG', 'Électromagnétisme', 30, 2.0),
('ARCHI', 'Architecture et fonctionnement des ordinateurs', 36, 3.0),
('RESEAUX', 'Bases des Réseaux informatiques', 30, 2.5),
('GESTION', 'Gestion et économie d''entreprise 1', 20, 1.5),
('THERM', 'Transfert thermique', 24, 2.0);

-- Salles
INSERT INTO salles (nom, capacite, equipements, batiment) VALUES
('Salle 1', 50, 'Standard', 'A'),
('Salle 15', 30, 'Standard', 'B'),
('Labo Réseaux', 20, 'Équipement TP', 'C');

-- Enseignants réels
INSERT INTO enseignants (user_id, specialite, statut, taux_horaire) VALUES
(1, 'Mathématiques', 'permanent', 25000.00), -- Administrateur (lié à admin pour test)
(2, 'Électronique', 'vacataire', 12000.00),  -- M. BONKOUNGOU Amadou
(3, 'Physique', 'permanent', 15000.00),      -- M. OUEDRAOGO Salifou
(4, 'Informatique', 'vacataire', 12000.00),  -- Mme BAMBARA
(5, 'Réseaux', 'vacataire', 12000.00),       -- M. COULIBALY Moussa
(6, 'Gestion', 'permanent', 15000.00);      -- M. GNADA Justin

-- Emploi du temps réel 1ATC-A (L1-RST)
INSERT INTO emploi_temps (classe_id, matiere_id, enseignant_id, salle_id, jour, heure_debut, heure_fin, type_seance, groupe) VALUES
-- Lundi (1)
(1, 1, 1, 1, 1, '07:30:00', '12:15:00', 'Cours', NULL),
(1, 2, 2, 2, 1, '14:00:00', '17:00:00', 'TD', NULL),
-- Mardi (2)
(1, 3, 3, 1, 2, '07:30:00', '12:15:00', 'Cours', NULL),
(1, 2, 2, 1, 2, '14:00:00', '17:00:00', 'TD', NULL),
-- Mercredi (3)
(1, 1, 1, 2, 3, '07:30:00', '12:15:00', 'Cours', NULL),
-- Jeudi (4)
(1, 4, 4, 3, 4, '07:30:00', '10:30:00', 'TP', 'GP3'),
(1, 4, 4, 3, 4, '10:30:00', '13:30:00', 'TP', 'GP4'),
-- Vendredi (5)
(1, 5, 5, 1, 5, '07:30:00', '12:15:00', 'TD', NULL),
(1, 6, 6, 2, 5, '15:00:00', '18:00:00', 'Cours', NULL),
-- Samedi (6)
(1, 1, 1, 1, 6, '07:30:00', '12:15:00', 'Cours', NULL),
(1, 7, 3, 1, 6, '13:00:00', '16:00:00', 'DS', NULL),
(2, 2, 2, 1, 5, '08:00:00', '10:00:00', 'TD', NULL),
-- L3-RST
(3, 5, 4, 3, 1, '14:00:00', '16:00:00', 'Cours', NULL),
(3, 1, 1, 3, 3, '10:00:00', '12:00:00', 'Cours', NULL),
(3, 3, 5, 3, 4, '08:00:00', '10:00:00', 'TD', NULL),
(3, 4, 3, 2, 6, '08:00:00', '10:00:00', 'Cours', NULL);

-- Séances du jour (automatiques) + séances passées terminées pour démo vacation
INSERT INTO seances (emploi_temps_id, date_seance, statut, heure_debut_reelle, heure_fin_reelle) VALUES
-- Séances du jour (planifiées)
(1, CURDATE(), 'planifie', NULL, NULL),
(2, CURDATE(), 'planifie', NULL, NULL),

-- Séances passées terminées (pour générer les vacations en démo)
-- Mois courant - semaine 1
(1, DATE_SUB(CURDATE(), INTERVAL 21 DAY), 'termine', 
   CONCAT(DATE_SUB(CURDATE(), INTERVAL 21 DAY), ' 08:05:00'),
   CONCAT(DATE_SUB(CURDATE(), INTERVAL 21 DAY), ' 10:00:00')),
(2, DATE_SUB(CURDATE(), INTERVAL 21 DAY), 'termine',
   CONCAT(DATE_SUB(CURDATE(), INTERVAL 21 DAY), ' 10:02:00'),
   CONCAT(DATE_SUB(CURDATE(), INTERVAL 21 DAY), ' 11:55:00')),
(5, DATE_SUB(CURDATE(), INTERVAL 20 DAY), 'termine',
   CONCAT(DATE_SUB(CURDATE(), INTERVAL 20 DAY), ' 08:00:00'),
   CONCAT(DATE_SUB(CURDATE(), INTERVAL 20 DAY), ' 10:00:00')),

-- Mois courant - semaine 2
(1, DATE_SUB(CURDATE(), INTERVAL 14 DAY), 'termine',
   CONCAT(DATE_SUB(CURDATE(), INTERVAL 14 DAY), ' 08:10:00'),
   CONCAT(DATE_SUB(CURDATE(), INTERVAL 14 DAY), ' 09:50:00')),
(3, DATE_SUB(CURDATE(), INTERVAL 12 DAY), 'termine',
   CONCAT(DATE_SUB(CURDATE(), INTERVAL 12 DAY), ' 08:00:00'),
   CONCAT(DATE_SUB(CURDATE(), INTERVAL 12 DAY), ' 10:00:00')),
(9, DATE_SUB(CURDATE(), INTERVAL 14 DAY), 'termine',
   CONCAT(DATE_SUB(CURDATE(), INTERVAL 14 DAY), ' 14:05:00'),
   CONCAT(DATE_SUB(CURDATE(), INTERVAL 14 DAY), ' 16:00:00')),

-- Mois courant - semaine 3  
(5, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'termine',
   CONCAT(DATE_SUB(CURDATE(), INTERVAL 6 DAY), ' 08:00:00'),
   CONCAT(DATE_SUB(CURDATE(), INTERVAL 6 DAY), ' 09:55:00')),
(6, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'termine',
   CONCAT(DATE_SUB(CURDATE(), INTERVAL 6 DAY), ' 10:00:00'),
   CONCAT(DATE_SUB(CURDATE(), INTERVAL 6 DAY), ' 12:00:00')),

-- Mois précédent (pour le graphique)
(1, DATE_SUB(CURDATE(), INTERVAL 35 DAY), 'termine',
   CONCAT(DATE_SUB(CURDATE(), INTERVAL 35 DAY), ' 08:00:00'),
   CONCAT(DATE_SUB(CURDATE(), INTERVAL 35 DAY), ' 10:00:00')),
(10, DATE_SUB(CURDATE(), INTERVAL 33 DAY), 'termine',
   CONCAT(DATE_SUB(CURDATE(), INTERVAL 33 DAY), ' 10:00:00'),
   CONCAT(DATE_SUB(CURDATE(), INTERVAL 33 DAY), ' 12:00:00')),
(7, DATE_SUB(CURDATE(), INTERVAL 30 DAY), 'termine',
   CONCAT(DATE_SUB(CURDATE(), INTERVAL 30 DAY), ' 14:00:00'),
   CONCAT(DATE_SUB(CURDATE(), INTERVAL 30 DAY), ' 16:00:00'));

-- Cahiers de texte pour les séances terminées (démo complète)
INSERT INTO cahier_texte (seance_id, titre_cours, contenu, avancement, devoirs, observations, statut, date_cloture) VALUES
(3, 'Introduction au PHP', 'Installation de XAMPP, syntaxe PHP de base, variables et opérateurs. Exercice pratique de création d''un fichier PHP.', 10, 'Installer XAMPP et créer un fichier hello.php', '', 'cloture', DATE_SUB(NOW(), INTERVAL 21 DAY)),
(4, 'Modèle Relationnel', 'Concepts de base : tables, clés primaires, clés étrangères. Formes normales (1NF, 2NF, 3NF).', 15, 'Exercice de normalisation du TD 1', 'Bonne participation', 'cloture', DATE_SUB(NOW(), INTERVAL 21 DAY)),
(5, 'React : Composants et JSX', 'Introduction à React 18, création de composants fonctionnels, JSX, props et state avec useState.', 20, 'Créer un composant TodoList', '', 'cloture', DATE_SUB(NOW(), INTERVAL 20 DAY)),
(6, 'PHP : Fonctions et Tableaux', 'Fonctions personnalisées, tableaux associatifs, boucles foreach. Projet mini calculateur.', 22, 'Finaliser le mini calculateur', '', 'cloture', DATE_SUB(NOW(), INTERVAL 14 DAY)),
(7, 'Modèle OSI', 'Les 7 couches du modèle OSI, rôle de chaque couche, encapsulation des données.', 25, 'Schéma du modèle OSI à compléter', 'Cours annulé partiellement (coupure électrique)', 'cloture', DATE_SUB(NOW(), INTERVAL 12 DAY)),
(8, 'Cryptographie de base', 'Chiffrement symétrique (AES), asymétrique (RSA), fonctions de hachage (SHA-256).', 30, 'Exercice pratique OpenSSL', '', 'cloture', DATE_SUB(NOW(), INTERVAL 14 DAY)),
(9, 'React : Routing et Context API', 'React Router v6, création de routes imbriquées, Context API pour la gestion globale de l''état.', 35, 'Implémenter un système de navigation multi-pages', '', 'cloture', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(10, 'Pare-feu et IDS', 'Configuration iptables, détection d''intrusion avec Snort, analyse de logs de sécurité.', 40, 'Configurer des règles iptables basiques', 'Matériel insuffisant pour le TP', 'cloture', DATE_SUB(NOW(), INTERVAL 6 DAY));

-- Pointages pour les séances terminées
INSERT INTO pointages (id_creneau, heure_pointage_reelle, ip_source, statut) VALUES
(3, DATE_SUB(NOW(), INTERVAL 21 DAY), '192.168.1.10', 'success'),
(4, DATE_SUB(NOW(), INTERVAL 21 DAY), '192.168.1.10', 'success'),
(5, DATE_SUB(NOW(), INTERVAL 20 DAY), '192.168.1.11', 'success'),
(6, DATE_SUB(NOW(), INTERVAL 14 DAY), '192.168.1.10', 'success'),
(7, DATE_SUB(NOW(), INTERVAL 12 DAY), '192.168.1.12', 'success'),
(8, DATE_SUB(NOW(), INTERVAL 14 DAY), '192.168.1.13', 'success'),
(9, DATE_SUB(NOW(), INTERVAL 6 DAY), '192.168.1.10', 'success'),
(10, DATE_SUB(NOW(), INTERVAL 6 DAY), '192.168.1.13', 'success');

-- Vacations du mois précédent (déjà validées, pour le graphique)
INSERT INTO vacations (enseignant_id, mois, annee, nb_heures_total, montant_total, etat_validation) VALUES
(1, MONTH(DATE_SUB(CURDATE(), INTERVAL 35 DAY)), YEAR(DATE_SUB(CURDATE(), INTERVAL 35 DAY)), 4.00, 48000.00, 'paye'),
(3, MONTH(DATE_SUB(CURDATE(), INTERVAL 30 DAY)), YEAR(DATE_SUB(CURDATE(), INTERVAL 30 DAY)), 2.00, 24000.00, 'valide_surveillant');

-- Notifications de démonstration
INSERT INTO notifications (destinataire_id, type, titre, message, lue, created_at) VALUES
(NULL, 'retard', 'Retard détecté', 'Le Prof. TRAORE Ali a pointé avec 12 min de retard pour la séance de Développement Web (L1-RST).', 0, DATE_SUB(NOW(), INTERVAL 14 DAY)),
(NULL, 'cahier_manquant', 'Cahier non rempli', 'La séance de Réseaux Informatiques du 2026-04-10 (L2-RST) n''a toujours pas de cahier de texte.', 0, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(2, 'vacation', 'Fiche disponible', 'Votre fiche de vacation du mois précédent est disponible pour consultation et signature.', 0, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(NULL, 'systeme', 'Bienvenue', 'Le système EduSchedule Pro est opérationnel. Bonne utilisation !', 1, DATE_SUB(NOW(), INTERVAL 30 DAY));

-- Logs d'activité de démonstration
INSERT INTO logs_activite (id_utilisateur, action, details_json, ip) VALUES
(1, 'login', '{"email":"admin@itrst.bf"}', '192.168.1.1'),
(2, 'pointage_qr', '{"seance_id":3,"statut":"success"}', '192.168.1.10'),
(7, 'cahier_signe', '{"cahier_id":1,"type":"delegue"}', '192.168.1.20'),
(2, 'cahier_cloture', '{"cahier_id":1}', '192.168.1.10'),
(1, 'vacation_generee', '{"enseignant_id":1,"mois":3,"annee":2026}', '192.168.1.1');
