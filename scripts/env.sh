#!/usr/bin/env bash
# ==============================================================================
# Soko Music Android Build Environment Configuration
# ==============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${PROJECT_ROOT}/build_apk_tmp"
WORK="${BUILD_DIR}/work"
OUTPUT_DIR="${PROJECT_ROOT}/dist"

# Safely load local .env if present (gitignored)
if [ -f "${PROJECT_ROOT}/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "${PROJECT_ROOT}/.env" 2>/dev/null || true
  set +a
fi

# Detect Android SDK Home
SDK_HOME="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-/usr/local/lib/android/sdk}}"
if [ ! -d "${SDK_HOME}" ] && [ -d "/home/saurabh/Android/Sdk" ]; then
  SDK_HOME="/home/saurabh/Android/Sdk"
fi

# Detect Build Tools
BUILD_TOOLS_DIR="${SDK_HOME}/build-tools"
if [ -d "${BUILD_TOOLS_DIR}" ]; then
  BUILD_TOOLS="$(find "${BUILD_TOOLS_DIR}" -mindepth 1 -maxdepth 1 -type d | sort -V | tail -n 1)"
else
  BUILD_TOOLS="${SDK_HOME}/build-tools/35.0.0"
fi

# Detect Platform JAR
PLATFORMS_DIR="${SDK_HOME}/platforms"
if [ -d "${PLATFORMS_DIR}" ]; then
  PLATFORM_DIR="$(find "${PLATFORMS_DIR}" -mindepth 1 -maxdepth 1 -type d | sort -V | tail -n 1)"
  PLATFORM_JAR="${PLATFORM_DIR}/android.jar"
else
  PLATFORM_JAR="${SDK_HOME}/platforms/android-35/android.jar"
fi

AAPT2="${BUILD_TOOLS}/aapt2"
D8="${BUILD_TOOLS}/d8"
ZIPALIGN="${BUILD_TOOLS}/zipalign"
APKSIGNER="${BUILD_TOOLS}/apksigner"

# Keystore configuration
KEYSTORE="${KEYSTORE_PATH:-${PROJECT_ROOT}/apps/android/keystore/soko_music.keystore}"
if [ ! -f "${KEYSTORE}" ] && [ -f "${PROJECT_ROOT}/scripts/soko_music.keystore" ]; then
  KEYSTORE="${PROJECT_ROOT}/scripts/soko_music.keystore"
fi
KEY_ALIAS="${KEYSTORE_ALIAS:-soko-music-key}"

# Keystore password handling (Zero hardcoded secrets committed)
if [ -n "${KEYSTORE_PASSWORD}" ]; then
  KEY_PASS="${KEYSTORE_PASSWORD}"
else
  # Use or generate a transient dev password stored alongside the gitignored dev keystore
  KEYSTORE_DIR="$(dirname "${KEYSTORE}")"
  mkdir -p "${KEYSTORE_DIR}"
  DEV_PW_FILE="${KEYSTORE_DIR}/.dev_keystore_pass"

  # If keystore does not exist or password file missing, reset so both are in sync
  if [ ! -f "${KEYSTORE}" ] && [ -f "${DEV_PW_FILE}" ]; then
    rm -f "${DEV_PW_FILE}"
  elif [ -f "${KEYSTORE}" ] && [ ! -f "${DEV_PW_FILE}" ]; then
    rm -f "${KEYSTORE}"
  fi

  if [ -f "${DEV_PW_FILE}" ]; then
    KEY_PASS="$(cat "${DEV_PW_FILE}")"
  else
    KEY_PASS="$(head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 24)"
    echo -n "${KEY_PASS}" > "${DEV_PW_FILE}"
    chmod 600 "${DEV_PW_FILE}" 2>/dev/null || true
  fi
fi
