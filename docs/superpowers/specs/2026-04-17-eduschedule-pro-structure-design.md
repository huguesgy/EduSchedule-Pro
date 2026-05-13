# Design Specification: EduSchedule Pro - Phase 2 Initial Structure

**Date:** 2026-04-17
**Status:** Approved

## 1. Overview
EduSchedule Pro is an integrated system for managing academic schedules, tracking course sessions via QR pointage, and managing teacher vacations. This specification covers the initial project organization for Phase 2 (Development).

## 2. Technical Stack
- **Backend:** PHP 8+ (REST API), MySQL 8, JWT for Authentication.
- **Frontend:** React 18 (SPA), Bootstrap 5, Context API.
- **Libraries:**
  - PHP: `chillerlan/php-qrcode` (QR), `mPDF` or `FPDF` (PDF).
  - JS: `signature_pad` (Digital Signature), `jsQR` (QR Scanning).

## 3. Project Structure
The project will be organized into three main top-level directories to ensure separation of concerns and compliance with the project requirements.

```text
root/
├── backend/
│   ├── api/           # Entry points for REST requests (e.g., login.php, seances.php)
│   ├── config/        # Database connection and environment configuration
│   ├── middleware/    # JWT validation and role-based access control
│   ├── models/        # PHP classes representing domain entities (Enseignant, Seance, etc.)
│   ├── utils/         # Helper functions for QR generation, PDF creation, etc.
│   └── composer.json  # Backend dependencies
├── frontend/
│   ├── public/        # Static assets
│   ├── src/
│   │   ├── components/ # Reusable React UI components
│   │   ├── context/    # React Contexts (AuthContext, NotificationContext)
│   │   ├── hooks/      # Custom React hooks (useAuth, useFetch)
│   │   ├── pages/      # Page-level components (Dashboard, Schedule, Login)
│   │   └── utils/      # Utility functions (date formatting, calculations)
│   └── package.json    # Frontend dependencies
├── .env.example       # Template for environment variables
└── database/
    └── database.sql    # Database schema and seed data
```

## 4. Environment Configuration
- Use `.env` file (not committed) for database credentials and JWT secrets.
- Provide `.env.example` in the repository as a template.

## 5. Data Flow
1. **Frontend (React)** sends HTTP requests to **Backend (PHP)** endpoints.
2. **Backend (PHP)** validates JWT in Middleware (if required).
3. **Backend (PHP)** uses Models to interact with **MySQL**.
4. **Backend (PHP)** returns JSON response to **Frontend**.

## 6. Next Steps
1. Create the folder structure.
2. Move `database.sql` to `database/`.
3. Configure the Backend database connection.
4. Initialize the React frontend.
