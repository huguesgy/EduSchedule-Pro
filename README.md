# 🎓 EduSchedule Pro

<div align="center">
  <p><em>Système de gestion académique intelligent : Emploi du temps, Pointage QR & Suivi des Vacations.</em></p>

[![PHP](https://img.shields.io/badge/PHP-8.2+-blue.svg)](https://www.php.net/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](#)
</div>

---

## 📝 Présentation du Projet

**EduSchedule Pro** est une solution complète de gestion des présences et des vacations pour les établissements universitaires. Développé pour répondre aux contraintes réelles de l'**ISGE-RST**, le système automatise le flux de travail depuis la planification des cours jusqu'à la génération des rapports de paiement.

### 🌟 Fonctionnalités Clés

| Fonctionnalité | Description Technique |
| :--- | :--- |
| **Planning 1ATC-A** | Structure spécifique en 3 plages (07h30, 10h00, 15h00) avec gestion des TP par groupes et DS grisés. |
| **Pointage QR Sécurisé** | Validation temporelle stricte (±15 min) et génération de token via HMAC-SHA256. |
| **Alerte Retard** | Notification automatique à l'administration si le pointage a lieu plus de 5 minutes après l'heure prévue. |
| **Cahier de Texte** | Signature numérique double (Enseignant/Délégué) pour valider le contenu des cours. |
| **Export PDF** | Génération de rapports dynamiques (Mpdf) pour les emplois du temps et les vacations. |

---

## 🛠 Architecture & Technologies

- **Frontend** : React 19, Vite, Bootstrap 5 (Responsive & Neo-brutalisme).
- **Backend** : PHP 8.2+ (API REST), Firebase-JWT (Authentification).
- **Base de données** : MariaDB / MySQL.
- **Sécurité** : Protection contre l'usurpation de QR Code et validation temporelle.

---

## 🚀 Installation & Démarrage

### 1. Prérequis
- PHP 8.2+ & Composer
- Node.js 20+ & npm
- Serveur MariaDB/MySQL

### 2. Configuration Rapide
```bash
./start-dev.sh --install --reset-db
```
*Cette commande installe les dépendances et initialise la base de données avec le planning **1ATC-A**.*

---

## 🧪 Guide de Test & Démonstration

### Comptes de Test (Mot de passe : `password`)
- **Administrateur** : `admin@itrst.bf`
- **Professeur (Pr BERE)** : `prof1@itrst.bf`
- **Délégué** : `delegue1@itrst.bf`

### ⚙️ Contrôle du Mode Système (Nouveau)
L'application propose deux modes de fonctionnement commutables en un clic depuis le **Panneau d'administration** (Profil Admin uniquement). Ce réglage est persistant en base de données :

1.  **MODE RÉEL (🔒)** : 
    *   **Validation stricte** : Le pointage QR est refusé si le scan a lieu plus de 15 minutes avant ou après l'heure prévue.
    *   **Sécurité maximale** : Interface épurée, sans raccourcis de test.
    
2.  **MODE LIBRE (🔓)** : 
    *   **Pointage flexible** : La restriction des 15 minutes est levée (idéal pour les démonstrations à toute heure).
    *   **Accès Rapides** : Affiche des badges de connexion automatique sur la page de Login.
    *   **Indicateur visuel** : Un badge vert "MODE LIBRE" apparaît dans la barre de navigation pour prévenir l'utilisateur.

---

## 📊 Structure de l'Emploi du Temps (Conformité 1ATC-A)

L'application reproduit fidèlement l'organisation académique :
- **Plage 1** : 07h30 → 09h30
- **Plage 2** : 10h00 → 12h15
- **Plage 3** : 15h00 → 18h00
- **Particularités** : Les examens (DS) apparaissent avec un fond grisé, et les séances aux horaires décalés (ex: TP) sont indiquées explicitement entre crochets.

---

<div align="center">
  <p>Développé pour l'ISGE-RST — Année Universitaire 2025-2026</p>
  <p><strong>Projet TP — Sous la direction du Dr BÉRÉ</strong></p>
</div>
