#!/bin/bash
set -euo pipefail

LOG_DIR="$(dirname "$0")/logs"
LOG_FILE="${1:-$(ls -t "$LOG_DIR"/*.log.gz 2>/dev/null | head -1)}"

if [[ -z "$LOG_FILE" ]]; then
    echo "Usage: $0 [logfile.gz]"
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
