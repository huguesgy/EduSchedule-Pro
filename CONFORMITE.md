# EduSchedule Pro — Guide de Conformité Académique 🎓

Ce document récapitule la mise en œuvre des exigences pour le projet EduSchedule Pro.

## 📁 1. Architecture & Technologies (§ 6 & 8)
- **Backend** : PHP 8.1+ (Architecture MVC, POO).
- **Frontend** : React 18+ (Vite).
- **Design** : Système "Néo-brutaliste" harmonisé avec **Bootstrap 5**.
- **Authentification** : JWT (JSON Web Tokens) géré par un `AuthContext` global.
- **Hooks & Contexts** : Utilisation de `useAuth()`, `useFetch()`, `AuthContext` et `NotifContext`.

## ⚙️ 2. Modules Fonctionnels

### 📅 Module 1 — Emploi du Temps (§ 4.1)
- [x] CRUD complet (Classes, Matières, Enseignants, Salles) via `AdminPanel.jsx`.
- [x] Détection automatique des conflits (Enseignant/Salle) dans `CreneauForm.jsx`.
- [x] Export PDF de l'emploi du temps hebdomadaire.
- [x] Vue filtrée par classe.

### 🔳 Module 2 — Pointage QR-Code (§ 4.2)
- [x] Token sécurisé (HMAC-SHA256) généré par `seance_qr.php`.
- [x] Scan temps réel avec `jsQR` (Scanner.jsx).
- [x] Validation GPS et fenêtre temporelle de ±15 minutes.
- [x] Log des pointages réussi/échoués.

### 📝 Module 3 — Cahier de Texte Numérique (§ 4.3)
- [x] Saisie complète (Titre, contenu, devoirs, avancement).
- [x] **Signatures numériques** (SignaturePad tactile) pour délégué et enseignant.
- [x] Clôture verrouillant la séance.
- [x] Export PDF de la fiche de séance.

### 💰 Module 4 — Fiche de Vacation (§ 4.4)
- [x] Calcul automatique basé sur les séances clôturées.
- [x] **Workflow de validation** complet : `Brouillon` → `Validé Surveillant` → `Approuvé Comptable` → `Payé`.
- [x] Export PDF de la fiche de vacation mensuelle.

## 🚀 3. Points Bonus Implémentés
- [x] **Mode Sombre** automatique via Media Queries CSS.
- [x] **Notifications Temps Réel** (Polling 30s) pour les alertes de retard/absence.
- [x] Graphiques financiers dynamiques avec `Recharts`.

## 🔍 4. Vérification pour la Soutenance
1. **Connexion** : Tester avec `admin@admin.com` / `password`.
2. **Administration** : Créer une salle et une matière dans `AdminPanel`.
3. **Planning** : Ajouter un créneau dans `Schedule`.
4. **Pointage** : Simuler un scan dans `Scanner` (ou saisie manuelle du token).
5. **Cahier** : Remplir et signer en tant que délégué puis enseignant.
6. **Vacations** : Générer la fiche mensuelle et faire le cycle de validation.
7. **Rapports** : Générer les PDF de synthèse.

---
*Projet finalisé par Antigravity pour Archux — Avril 2026.*
