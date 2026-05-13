# Précautions pour la remise du projet EduSchedule Pro

Veuillez suivre ces étapes scrupuleusement avant de compresser et d'envoyer votre travail par mail.

## 1. Basculer en MODE RÉEL (Verrouillé)
C'est l'étape la plus importante pour votre évaluation.
- Allez dans le **Panneau d'administration**.
- Cliquez sur l'interrupteur pour qu'il affiche **🔒 RÉEL** (Cadenas fermé).
- **Pourquoi ?** Cela prouve que votre système est sécurisé par défaut. Le professeur pourra lui-même activer le mode libre s'il souhaite tester la flexibilité après avoir validé votre sécurité.

## 2. Nettoyer les dossiers volumineux
Pour que votre archive soit légère et envoyable par mail (quelques Mo au lieu de plusieurs centaines), ne compressez PAS les dossiers suivants :
- `frontend/node_modules/`
- `backend/vendor/`
- `.venv/` ou `venv/`
- `.runtime/` (contient vos logs de test)

## 3. Gestion des fichiers de configuration
- Vérifiez qu'un fichier `.env.example` est présent à la racine avec les clés nécessaires.
- Si vous laissez le fichier `.env`, assurez-vous qu'il contient des paramètres de connexion simples (ex: localhost, root).

## 4. Validation de la base de données
- Vérifiez que le fichier `database/database.sql` est à jour.
- Il doit contenir le planning **1ATC-A** (Algèbre 2, Électronique de puissance, etc.) et la table `system_config`.

## 5. Structure recommandée de l'archive ZIP
Votre fichier final (ex: `Nom_Prenom_EduSchedule.zip`) devrait contenir :
- `/backend/` (sans vendor)
- `/frontend/` (sans node_modules)
- `/database/` (avec le .sql final)
- `/docs/`
- `README.md`
- `start-dev.sh` / `stop-dev.sh`
- `.env.example`

---
**Bonne chance pour votre présentation !**
