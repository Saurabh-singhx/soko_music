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

# Calculate dynamic versioning for the build
if [ -z "${VERSION_CODE}" ]; then
  if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    VERSION_CODE=$(git rev-list --count HEAD 2>/dev/null || echo 1)
  else
    VERSION_CODE=1
  fi
fi

if [ -z "${VERSION_NAME}" ]; then
  if [ -f "${PROJECT_ROOT}/VERSION" ]; then
    BASE_VERSION=$(cat "${PROJECT_ROOT}/VERSION" | tr -d '[:space:]')
  else
    BASE_VERSION="1.0.0"
  fi
  if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    GIT_TAG=$(git describe --tags --exact-match 2>/dev/null || echo "")
    if [ -n "${GIT_TAG}" ]; then
      VERSION_NAME="${GIT_TAG#v}"
    else
      VERSION_NAME="${BASE_VERSION}"
    fi
  else
    VERSION_NAME="${BASE_VERSION}"
  fi
fi

echo "=========================================================="
echo "📦 Build Version: ${VERSION_NAME} (versionCode: ${VERSION_CODE})"
echo "=========================================================="

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

# Copy AndroidManifest.xml and inject dynamic version
if [ -f "${PROJECT_ROOT}/app/src/main/AndroidManifest.xml" ]; then
  cp "${PROJECT_ROOT}/app/src/main/AndroidManifest.xml" "${WORK}/AndroidManifest.xml"
  sed -i "s/android:versionCode=\"[0-9]*\"/android:versionCode=\"${VERSION_CODE}\"/g" "${WORK}/AndroidManifest.xml"
  sed -i "s/android:versionName=\"[^\"]*\"/android:versionName=\"${VERSION_NAME}\"/g" "${WORK}/AndroidManifest.xml"
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

# Inject versioning into updater.js and generate version.json
if [ -f "${WORK}/assets/js/utils/updater.js" ]; then
  sed -i "s/defaultVersion: '[^']*'/defaultVersion: '${VERSION_NAME}'/g" "${WORK}/assets/js/utils/updater.js"
  sed -i "s/defaultBuildNumber: [0-9]*/defaultBuildNumber: ${VERSION_CODE}/g" "${WORK}/assets/js/utils/updater.js"
fi

cat << EOF > "${WORK}/assets/version.json"
{
  "version": "${VERSION_NAME}",
  "versionCode": ${VERSION_CODE},
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "gitCommit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
}
EOF
mkdir -p "${WORK}/assets/assets"
if [ -d "${PROJECT_ROOT}/assets" ] && [ -n "$(ls -A "${PROJECT_ROOT}/assets" 2>/dev/null)" ]; then
  cp -r "${PROJECT_ROOT}/assets/"* "${WORK}/assets/assets/"
fi
mkdir -p "${WORK}/assets/music"
if [ -d "${PROJECT_ROOT}/assets/music" ] && [ -n "$(ls -A "${PROJECT_ROOT}/assets/music" 2>/dev/null)" ]; then
  cp -r "${PROJECT_ROOT}/assets/music/"* "${WORK}/assets/music/"
fi

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
