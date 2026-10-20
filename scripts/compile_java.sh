#!/usr/bin/env bash
set -e

# ==============================================================================
# Stage 2: Java Compilation with javac
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/env.sh"

echo "[2/4] Compiling Java classes..."
javac -source 8 -target 8 -d "${WORK}/obj" \
  -cp "${PLATFORM_JAR}" \
  "${WORK}/gen/com/soko/music/R.java" \
  $(find "${WORK}/src" -name "*.java")
