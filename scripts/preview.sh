#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MOBILE_HTML="${PROJECT_ROOT}/apps/mobile/index.html"

echo "=========================================================="
echo "📱 Running Soko Music Mobile Multi-Device Visual Audit"
echo "=========================================================="

if command -v mobile-preview >/dev/null 2>&1; then
  echo "[Preview] Auditing on Google Pixel viewport..."
  mobile-preview --file "${MOBILE_HTML}" --device pixel --audit
else
  echo "[Preview] mobile-preview not found in PATH; falling back to Python HTTP server..."
  python3 -m http.server 8080 --directory "${PROJECT_ROOT}/apps/mobile"
fi
