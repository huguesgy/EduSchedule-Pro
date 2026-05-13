# Checklist Demo Et Soutenance

## Avant la demo
- Verifier que MariaDB/MySQL est demarre
- Importer `database/database.sql` si besoin
- Verifier les variables du fichier `.env`
- Lancer le backend avec `php -S 127.0.0.1:8000 -t backend`
- Lancer le frontend avec `npm run dev` dans `frontend/`
- Verifier qu'une webcam est disponible pour le scan QR
- Preparer les comptes de connexion a presenter

## Comptes a avoir sous la main
- Admin
- Enseignant
- Delegue
- Surveillant
- Comptable

## Scenario de demo recommande
1. Presenter rapidement le probleme traite par EduSchedule Pro
2. Montrer la connexion et le tableau de bord
3. Ouvrir l'emploi du temps d'une classe
4. Generer un QR Code pour une seance
5. Montrer le pointage enseignant
6. Remplir le cahier de texte
7. Faire signer le delegue puis l'enseignant
8. Generer une vacation
9. Revenir au tableau de bord pour montrer l'impact metier

## Points a bien expliquer
- separation frontend React / backend PHP / base MySQL
- authentification JWT
- role de chaque acteur
- logique de validation temporelle du pointage
- stockage des signatures et cloture de seance
- calcul automatique des vacations

## Verifications avant de parler de qualite
- `npm run lint`
- `npm run build`
- verification syntaxe PHP
- coherence entre le schema SQL et les modeles backend

## Questions probables du jury
- Pourquoi avoir choisi React + PHP ?
- Comment les roles sont-ils proteges ?
- Comment le QR Code est-il valide ?
- Que se passe-t-il si un enseignant scanne hors plage horaire ?
- Comment la vacation est-elle calculee ?
- Comment avez-vous structure la base de donnees ?
- Quelles difficultes avez-vous rencontrees ?

## Reponses techniques a preparer
- expliquer la structure du dossier `backend/`
- expliquer la structure du dossier `frontend/`
- montrer le fichier `database/database.sql`
- citer les endpoints principaux
- justifier les choix de securite minimums

## Plan de secours
- garder MariaDB deja demarre avant la soutenance
- garder un navigateur deja connecte avec un compte admin
- avoir une seance de test prevue le jour meme
- preparer une demonstration manuelle si la camera refuse l'acces
- garder les commandes de lancement ouvertes dans le terminal

## A ne pas oublier
- parler des limites actuelles du projet avec honnetete
- insister sur les flux qui fonctionnent vraiment
- montrer une architecture claire plutot qu'une demo confuse
- terminer par les ameliorations possibles
