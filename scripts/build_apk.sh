#!/usr/bin/env bash
set -e

# ==============================================================================
# Soko Music Standalone Android APK Generator
# Coordinates multi-stage build pipeline:
# 1. Icon generation (tools/generate_icons.py)
# 2. Workspace preparation
# 3. AAPT2 resource compilation (scripts/compile_res.sh)
# 4. Java compilation (scripts/compile_java.sh)
# 5. DEX bytecode compilation (scripts/dex.sh)
# 6. Zipalign & Apksigner (scripts/sign.sh)
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/env.sh"

echo "=== Soko Music Mobile APK Generator ==="
echo "Project Root: ${PROJECT_ROOT}"
echo "Android SDK: ${SDK_HOME}"
echo "Build Tools: ${BUILD_TOOLS}"
echo "Target Platform: ${PLATFORM_JAR}"

# 1. Generate launcher icons via tools/
python3 "${PROJECT_ROOT}/tools/generate_icons.py"

# 2. Clean and prepare workspace
rm -rf "${BUILD_DIR}"
mkdir -p "${OUTPUT_DIR}"
mkdir -p "${WORK}/res/values"
mkdir -p "${WORK}/res/drawable"
mkdir -p "${WORK}/src/com/soko/music"
mkdir -p "${WORK}/gen"
mkdir -p "${WORK}/obj"
mkdir -p "${WORK}/dex"
mkdir -p "${WORK}/assets"

# Copy Android resources
if [ -d "${PROJECT_ROOT}/app/src/main/res" ]; then
  cp -r "${PROJECT_ROOT}/app/src/main/res/"* "${WORK}/res/"
elif [ -d "${PROJECT_ROOT}/apps/android/res" ]; then
  cp -r "${PROJECT_ROOT}/apps/android/res/"* "${WORK}/res/"
fi

# Copy AndroidManifest.xml
if [ -f "${PROJECT_ROOT}/app/src/main/AndroidManifest.xml" ]; then
  cp "${PROJECT_ROOT}/app/src/main/AndroidManifest.xml" "${WORK}/AndroidManifest.xml"
fi

# Copy web assets
if [ -f "${PROJECT_ROOT}/app/src/main/assets/index.html" ]; then
  cp "${PROJECT_ROOT}/app/src/main/assets/index.html" "${WORK}/assets/"
  if [ -d "${PROJECT_ROOT}/app/src/main/assets/css" ]; then
    cp -r "${PROJECT_ROOT}/app/src/main/assets/css" "${WORK}/assets/"
  fi
  if [ -d "${PROJECT_ROOT}/app/src/main/assets/js" ]; then
    cp -r "${PROJECT_ROOT}/app/src/main/assets/js" "${WORK}/assets/"
  fi
else
  cp "${PROJECT_ROOT}/apps/mobile/index.html" "${WORK}/assets/"
fi
mkdir -p "${WORK}/assets/assets"
cp -r "${PROJECT_ROOT}/assets/"* "${WORK}/assets/assets/"
mkdir -p "${WORK}/assets/music"
cp -r "${PROJECT_ROOT}/assets/music/"* "${WORK}/assets/music/"

# Copy Java sources
if [ -d "${PROJECT_ROOT}/app/src/main/java" ]; then
  cp -r "${PROJECT_ROOT}/app/src/main/java/"* "${WORK}/src/"
fi

# Execute build stages
bash "${SCRIPT_DIR}/compile_res.sh"
bash "${SCRIPT_DIR}/compile_java.sh"
bash "${SCRIPT_DIR}/dex.sh"
bash "${SCRIPT_DIR}/sign.sh"

# Clean temporary build directory
rm -rf "${BUILD_DIR}"
