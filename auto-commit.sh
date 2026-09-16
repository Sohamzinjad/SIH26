#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.auto-commit.pid"
LOG_FILE="$SCRIPT_DIR/.auto-commit.log"
INTERVAL="${AUTO_COMMIT_INTERVAL:-40}"
BRANCH="${AUTO_COMMIT_BRANCH:-$(git -C "$SCRIPT_DIR" branch --show-current)}"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

generate_commit_message() {
  local statuses="$1"
  local additions=() modifications=() deletions=() renames=()

  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    local st="${line:0:2}"
    local path="${line:3}"
    case "$st" in
      '??') additions+=("$path") ;;
      'A '*|'A'*) additions+=("$path") ;;
      'M '*|'M'*) modifications+=("$path") ;;
      'D '*|'D'*) deletions+=("$path") ;;
      'R'*)
        local arrow=" -> "
        local arrow_idx="${path#*"$arrow"}"
        if [[ "$arrow_idx" != "$path" ]]; then
          renames+=("$path")
        else
          modifications+=("$path")
        fi
        ;;
      'C'*) additions+=("$path") ;;
      *) modifications+=("$path") ;;
    esac
  done <<< "$statuses"

  local parts=()
  [[ ${#additions[@]} -gt 0 ]] && parts+=("add $(join_file_names "${additions[@]}")")
  [[ ${#modifications[@]} -gt 0 ]] && parts+=("update $(join_file_names "${modifications[@]}")")
  [[ ${#deletions[@]} -gt 0 ]] && parts+=("remove $(join_file_names "${deletions[@]}")")
  [[ ${#renames[@]} -gt 0 ]] && parts+=("rename $(join_renames "${renames[@]}")")

  local verb="chore"
  if [[ ${#additions[@]} -gt 0 ]]; then
    verb="feat"
  elif [[ ${#modifications[@]} -gt 0 ]]; then
    verb="fix"
  fi

  local detail
  detail="$(join_parts "${parts[@]}")"

  echo "$verb: $detail"
}

file_base() {
  echo "${1##*/}"
}

join_file_names() {
  local joined=""
  for p in "$@"; do
    [[ -n "$joined" ]] && joined="$joined, "
    joined="$joined$(file_base "$p")"
  done
  echo "${joined%, }"
}

join_renames() {
  local joined=""
  for p in "$@"; do
    [[ -n "$joined" ]] && joined="$joined, "
    local base="${p##*/}"
    joined="$joined$base"
  done
  echo "${joined%, }"
}

join_parts() {
  local joined=""
  for p in "$@"; do
    [[ -n "$joined" ]] && joined="$joined; "
    joined="$joined$p"
  done
  echo "${joined%, }"
}

run_once() {
  cd "$SCRIPT_DIR"

  local changes
  changes="$(git status --porcelain)"
  [[ -z "$changes" ]] && return 0

  local names
  names="$(git status --porcelain | sed 's/^...//')"

  local statuses
  statuses="$(git status --porcelain)"

  git add -A

  local msg
  msg="$(generate_commit_message "$statuses")"

  git commit -m "$msg" -m "auto-committed files:
$names" >> "$LOG_FILE" 2>&1

  log "Committed: $msg"

  if git push origin "$BRANCH" >> "$LOG_FILE" 2>&1; then
    log "Pushed to origin/$BRANCH"
  else
    log "Push failed, will retry next cycle"
  fi
}

start() {
  if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "auto-commit already running (pid $(cat "$PID_FILE"))"
    exit 0
  fi

  nohup bash "$0" --worker >/dev/null 2>&1 &
  echo $! > "$PID_FILE"
  echo "auto-commit started (pid $(cat "$PID_FILE"), every ${INTERVAL}s)"
}

stop() {
  if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    kill "$(cat "$PID_FILE")"
    rm -f "$PID_FILE"
    echo "auto-commit stopped"
  else
    rm -f "$PID_FILE"
    echo "auto-commit not running"
  fi
}

status_cmd() {
  if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "running (pid $(cat "$PID_FILE"))"
  else
    echo "not running"
  fi
}

worker() {
  log "auto-commit worker started (interval: ${INTERVAL}s, branch: ${BRANCH})"
  while true; do
    sleep "$INTERVAL"
    run_once
  done
}

case "${1:-}" in
  start) start ;;
  stop) stop ;;
  status) status_cmd ;;
  --worker) worker ;;
  *)
    echo "Usage: $0 {start|stop|status}" >&2
    exit 1
    ;;
esac
