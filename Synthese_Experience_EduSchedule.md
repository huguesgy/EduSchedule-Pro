# 📘 Note de Synthèse : Retour d'Expérience Technique - EduSchedule Pro

Ce document résume les apprentissages, les défis et la démarche de réflexion adoptée lors du développement de la plateforme.

---

## 1. Ce que ce travail m'a appris (Nouveaux Concepts)
*   **Sécurisation par Token (JWT)** : Compréhension du cycle de vie d'un jeton d'authentification, de sa génération côté serveur à son stockage sécurisé dans le navigateur.
*   **Génération de Données Dynamiques (QR Codes)** : Apprentissage de la création de tokens uniques basés sur le hachage HMAC-SHA256 pour garantir que les QR Codes ne puissent pas être falsifiés.
*   **Architecture API REST** : Mise en place d'une communication structurée entre un frontend moderne (React) et un backend PHP, en respectant les méthodes HTTP (GET, POST, PUT, DELETE).
*   **Génération de Rapports PDF** : Utilisation de bibliothèques professionnelles (mPDF) pour transformer des données de base de données en documents administratifs officiels.

## 2. Ce qu'il m'a permis de consolider (Compétences Renforcées)
*   **Maîtrise de React 19** : Utilisation avancée des Hooks (`useEffect`, `useContext`, `useCallback`) pour gérer l'état global de l'application (authentification, notifications).
*   **Conception de Bases de Données** : Modélisation de relations complexes (Many-to-Many) entre les créneaux horaires, les enseignants et les séances réelles.
*   **Design Responsive & UI/UX** : Consolidation des compétences en CSS moderne pour créer une interface "Neo-brutaliste" qui soit à la fois esthétique et fonctionnelle.
*   **Développement Full-Stack** : Capacité à naviguer entre la logique métier côté serveur et l'expérience utilisateur côté client.

## 3. Difficultés rencontrées et Solutions apportées
| Difficulté | Cause | Solution |
| :--- | :--- | :--- |
| **Test de la validation temporelle** | La règle des ±15 min rendait les tests impossibles en dehors des heures de cours réelles. | Création d'un **"Mode Pédagogique"** commutable dans l'Admin pour lever temporairement les restrictions. |
| **Versionnage des bibliothèques** | Conflits de constantes entre différentes versions du générateur de QR Code. | Analyse approfondie de la documentation de la bibliothèque et mise à jour du code vers les standards de la version 5. |
| **Incohérence de configuration** | Conflits entre les fichiers `.env` du frontend et du backend provoquant des erreurs 401. | Unification des secrets de sécurité et centralisation de la configuration système en base de données. |
| **Erreur de rendu (Écran blanc)** | Accès à des variables d'état avant leur chargement complet. | Mise en place de "Safe Checks" (conditions de sécurité) dans les composants React pour gérer le chargement. |

## 4. Exercice de réflexion tout au long du projet
Ma réflexion a été guidée par deux principes majeurs :

*   **Réalisme Académique** : Plutôt que de faire un emploi du temps générique, j'ai choisi de modéliser le planning réel de la **1ATC-A**. Cela a nécessité de réfléchir à la gestion des cours "chevauchant" plusieurs plages horaires et à la distinction visuelle des examens (DS).
*   **Flexibilité d'Administration** : J'ai réfléchi à la manière dont un administrateur non-technique utiliserait l'outil. C'est pourquoi j'ai intégré le contrôle du "Mode Système" (Libre/Réel) directement dans l'interface graphique, évitant ainsi d'avoir à modifier des fichiers de configuration complexes.
*   **Intégrité des Données** : La mise en place de la double signature (Enseignant/Délégué) dans le cahier de texte a été pensée pour responsabiliser les acteurs et garantir que le contenu saisi correspond bien au cours dispensé.

---
*Ce document sert de base pour la rédaction de la partie "Analyse et Critique" du rapport de projet.*
