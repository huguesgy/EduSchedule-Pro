# Implementation Plan: EduSchedule Pro - Project Organization

This plan outlines the steps to organize the project structure for Phase 2, as defined in the [design specification](../specs/2026-04-17-eduschedule-pro-structure-design.md).

## Phase 1: Directory Setup & Migration
1. [ ] Create project directories:
   - `backend/api`, `backend/config`, `backend/middleware`, `backend/models`, `backend/utils`
   - `frontend`
   - `database`
   - `docs/resources` (for PDFs)
2. [ ] Move existing files to their new locations:
   - `database.sql` -> `database/database.sql`
   - `Projet_EduSchedule_Pro.pdf` -> `docs/resources/`
   - `Rapport_Conception_EduSchedule_Pro.pdf` -> `docs/resources/`
   - `project_requirements.txt` -> `docs/resources/`
   - `generate_pdf.py` -> `backend/utils/` (assuming it's a utility)

## Phase 2: Backend Initialization
1. [ ] Create `backend/composer.json` with basic metadata.
2. [ ] Create `.env.example` with placeholders for:
   - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`
   - `JWT_SECRET`
3. [ ] Create `backend/config/db.php` for PDO connection.

## Phase 3: Frontend Initialization
1. [ ] Initialize React + Vite in the `frontend` directory:
   ```bash
   npx create-vite@latest frontend --template react
   ```
2. [ ] Install frontend dependencies:
   - `bootstrap`, `react-router-dom`, `axios`, `signature_pad`, `jsqr`
3. [ ] Create the requested directory structure in `frontend/src`:
   - `components`, `context`, `hooks`, `pages`, `utils`

## Phase 4: Verification
1. [ ] Verify folder structure matches the spec.
2. [ ] Verify `database.sql` is accessible.
3. [ ] Verify Vite dev server starts.
