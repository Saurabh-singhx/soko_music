#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${PROJECT_ROOT}/dist"

echo "=========================================================="
echo "📦 Packaging Soko Music Mobile Standalone Assets"
echo "=========================================================="

rm -rf "${DIST_DIR}"
mkdir -p "${DIST_DIR}"
cp -rL "${PROJECT_ROOT}/apps/mobile"/* "${DIST_DIR}/"
mkdir -p "${DIST_DIR}/assets"
cp -r "${PROJECT_ROOT}/assets"/* "${DIST_DIR}/assets/"

echo "[Build] Created distribution package in ${DIST_DIR}"
ls -la "${DIST_DIR}"
