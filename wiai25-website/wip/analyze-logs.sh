#!/bin/bash
set -euo pipefail

LOG_DIR="$(dirname "$0")/logs"

# --all Flag: Alle Logs zusammen auswerten
if [[ "${1:-}" == "--all" ]]; then
    echo "=== Log Analysis: ALL LOGS ==="
    echo

    LOG_FILES=$(ls -t "$LOG_DIR"/*.log.gz 2>/dev/null || true)
    if [[ -z "$LOG_FILES" ]]; then
        echo "No log files found in $LOG_DIR"
        exit 1
    fi

    echo "Analyzing $(echo "$LOG_FILES" | wc -l | tr -d ' ') log files:"
    for f in $LOG_FILES; do echo "  - $(basename "$f")"; done
    echo

    # Alle Logs zusammen dekomprimieren
    DATA=$(for f in $LOG_FILES; do gunzip -c "$f"; done)
else
    LOG_FILE="${1:-$(ls -t "$LOG_DIR"/*.log.gz 2>/dev/null | head -1)}"

    if [[ -z "$LOG_FILE" ]]; then
        echo "Usage: $0 [logfile.gz | --all]"
        exit 1
    fi

    echo "=== Log Analysis: $(basename "$LOG_FILE") ==="
    echo

    # Dekomprimieren falls nötig
    if [[ "$LOG_FILE" == *.gz ]]; then
        DATA=$(gunzip -c "$LOG_FILE")
    else
        DATA=$(cat "$LOG_FILE")
    fi
fi

# Bots ausfiltern
HUMAN_DATA=$(echo "$DATA" | grep -v -E '(bot|crawler|spider|curl|wget|python|Go-http|HeadlessChrome)' || true)

echo "Total Requests: $(echo "$DATA" | wc -l | tr -d ' ')"
echo "Human Requests: $(echo "$HUMAN_DATA" | wc -l | tr -d ' ')"
echo
echo "Unique IPs: $(echo "$HUMAN_DATA" | jq -r '.request.remote_ip' | sort -u | wc -l | tr -d ' ')"
echo
echo "Top 10 URLs:"
echo "$HUMAN_DATA" | jq -r '.request.uri' | sort | uniq -c | sort -rn | head -10
echo
echo "Status Codes:"
echo "$HUMAN_DATA" | jq -r '.status' | sort | uniq -c | sort -rn
