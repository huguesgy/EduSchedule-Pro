#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DIR="$ROOT_DIR/.runtime"
BACKEND_LOG="$RUNTIME_DIR/backend.log"
FRONTEND_LOG="$RUNTIME_DIR/frontend.log"
BACKEND_PID_FILE="$RUNTIME_DIR/backend.pid"
FRONTEND_PID_FILE="$RUNTIME_DIR/frontend.pid"

RESET_DB=0
INSTALL_DEPS=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --reset-db)
      RESET_DB=1
      ;;
    --install)
      INSTALL_DEPS=1
      ;;
    *)
      echo "Option inconnue: $1"
      echo "Usage: ./start-dev.sh [--reset-db] [--install]"
      exit 1
      ;;
  esac
  shift
done

mkdir -p "$RUNTIME_DIR"

if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
else
  echo "Fichier .env introuvable."
  exit 1
fi

DB_HOST="${DB_HOST:-localhost}"
DB_NAME="${DB_NAME:-eduschedule_db}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-}"
BACKEND_HOST="127.0.0.1"
BACKEND_PORT="8000"
FRONTEND_HOST="127.0.0.1"
FRONTEND_PORT="5173"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Commande requise manquante: $1"
    exit 1
  fi
}

ensure_stopped_pid() {
  local pid_file="$1"
  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file")"
    if kill -0 "$pid" >/dev/null 2>&1; then
      echo "Un processus est deja en cours (PID $pid). Lance ./stop-dev.sh avant."
      exit 1
    fi
    rm -f "$pid_file"
  fi
}

ensure_db() {
  if mariadb-admin -h "$DB_HOST" -u "$DB_USER" "-p$DB_PASS" ping >/dev/null 2>&1; then
    return
  fi

  echo "MariaDB n'est pas joignable. Tentative de demarrage du service..."
  if command -v systemctl >/dev/null 2>&1; then
    systemctl start mariadb
  fi

  sleep 2

  if ! mariadb-admin -h "$DB_HOST" -u "$DB_USER" "-p$DB_PASS" ping >/dev/null 2>&1; then
    echo "Impossible de joindre MariaDB. Demarre le service puis relance le script."
    exit 1
  fi
}

import_db_if_needed() {
  if [[ "$RESET_DB" -eq 1 ]]; then
    echo "Reimport de la base..."
    mariadb -h "$DB_HOST" -u "$DB_USER" "-p$DB_PASS" < "$ROOT_DIR/database/database.sql"
    return
  fi

  if ! mariadb -N -h "$DB_HOST" -u "$DB_USER" "-p$DB_PASS" -e "USE $DB_NAME; SHOW TABLES;" >/dev/null 2>&1; then
    echo "Base absente ou incomplete. Import automatique..."
    mariadb -h "$DB_HOST" -u "$DB_USER" "-p$DB_PASS" < "$ROOT_DIR/database/database.sql"
  fi
}

install_dependencies_if_needed() {
  if [[ "$INSTALL_DEPS" -eq 1 || ! -d "$ROOT_DIR/backend/vendor" ]]; then
    echo "Installation des dependances backend..."
    (cd "$ROOT_DIR/backend" && composer install)
  fi

  if [[ "$INSTALL_DEPS" -eq 1 || ! -d "$ROOT_DIR/frontend/node_modules" ]]; then
    echo "Installation des dependances frontend..."
    (cd "$ROOT_DIR/frontend" && npm install)
  fi
}

start_backend() {
  echo "Demarrage du backend PHP..."
  (
    cd "$ROOT_DIR"
    nohup php -S "$BACKEND_HOST:$BACKEND_PORT" -t backend >"$BACKEND_LOG" 2>&1 &
    echo $! >"$BACKEND_PID_FILE"
  )
}

start_frontend() {
  echo "Demarrage du frontend Vite..."
  (
    cd "$ROOT_DIR/frontend"
    nohup npm run dev -- --host "$FRONTEND_HOST" --port "$FRONTEND_PORT" >"$FRONTEND_LOG" 2>&1 &
    echo $! >"$FRONTEND_PID_FILE"
  )
}

require_command php
require_command mariadb
require_command mariadb-admin
require_command npm

ensure_stopped_pid "$BACKEND_PID_FILE"
ensure_stopped_pid "$FRONTEND_PID_FILE"
ensure_db
import_db_if_needed
install_dependencies_if_needed
start_backend
start_frontend

sleep 2

echo
echo "Stack demarree."
echo "Backend : http://$BACKEND_HOST:$BACKEND_PORT"
echo "Frontend: http://$FRONTEND_HOST:$FRONTEND_PORT"
echo "Logs    : $BACKEND_LOG / $FRONTEND_LOG"
echo "Arret   : ./stop-dev.sh"
