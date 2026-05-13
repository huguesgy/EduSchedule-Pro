#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DIR="$ROOT_DIR/.runtime"

stop_from_file() {
  local pid_file="$1"
  local label="$2"

  if [[ ! -f "$pid_file" ]]; then
    echo "$label: aucun PID enregistre."
    return
  fi

  local pid
  pid="$(cat "$pid_file")"

  if kill -0 "$pid" >/dev/null 2>&1; then
    kill "$pid"
    echo "$label arrete (PID $pid)."
  else
    echo "$label: processus deja termine."
  fi

  rm -f "$pid_file"
}

stop_from_file "$RUNTIME_DIR/backend.pid" "Backend"
stop_from_file "$RUNTIME_DIR/frontend.pid" "Frontend"
