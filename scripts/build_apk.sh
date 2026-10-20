#!/usr/bin/env bash
set -e

# ==============================================================================
# Soko Music Standalone Android APK Generator
# Builds production-ready, signed, zipalign-verified Android APK.
# ==============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${PROJECT_ROOT}/build_apk_tmp"
OUTPUT_DIR="${PROJECT_ROOT}/dist"
mkdir -p "${OUTPUT_DIR}"

# Detect Android SDK Home
SDK_HOME="${ANDROID_HOME:-/home/saurabh/Android/Sdk}"
if [ ! -d "${SDK_HOME}" ] && [ -d "/usr/local/lib/android/sdk" ]; then
  SDK_HOME="/usr/local/lib/android/sdk"
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

VERSION_CODE="1"
VERSION_NAME="1.0.0"

echo "=== Soko Music Mobile APK Generator ==="
echo "Project Root: ${PROJECT_ROOT}"
echo "Android SDK: ${SDK_HOME}"
echo "Build Tools: ${BUILD_TOOLS}"
echo "Target Platform: ${PLATFORM_JAR}"

# Generate launcher icons
python3 "${PROJECT_ROOT}/scripts/generate_icons.py"

# Clean and prepare workspace
rm -rf "${BUILD_DIR}"
WORK="${BUILD_DIR}/work"
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
elif [ -d "${PROJECT_ROOT}/res" ]; then
  cp -r "${PROJECT_ROOT}/res/"* "${WORK}/res/"
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

# 4. Keystore
KEYSTORE="${PROJECT_ROOT}/apps/android/keystore/soko_music.keystore"
if [ ! -f "${KEYSTORE}" ] && [ -f "${PROJECT_ROOT}/scripts/soko_music.keystore" ]; then
  KEYSTORE="${PROJECT_ROOT}/scripts/soko_music.keystore"
fi
KEY_PASS="sokomusic123"
if [ ! -f "${KEYSTORE}" ]; then
  mkdir -p "$(dirname "${KEYSTORE}")"
  echo "Generating persistent keystore at ${KEYSTORE}..."
  keytool -genkeypair -v \
    -keystore "${KEYSTORE}" \
    -alias "soko-music-key" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "${KEY_PASS}" \
    -keypass "${KEY_PASS}" \
    -dname "CN=SokoMusic, OU=Mobile, O=Soko, L=San Francisco, ST=CA, C=US"
fi

# 5. Compile Resources with AAPT2
echo "[1/5] Compiling resources with AAPT2..."
"${AAPT2}" compile --dir "${WORK}/res" -o "${WORK}/res.zip"
"${AAPT2}" link -I "${PLATFORM_JAR}" \
  --auto-add-overlay \
  -0 opus -0 mp3 -0 m4a -0 webm -0 ogg -0 jpg -0 png \
  -R "${WORK}/res.zip" \
  --manifest "${WORK}/AndroidManifest.xml" \
  -A "${WORK}/assets" \
  --java "${WORK}/gen" \
  -o "${WORK}/unaligned.apk"

# 6. Compile Java Sources
echo "[2/5] Compiling Java classes..."
javac -source 8 -target 8 -d "${WORK}/obj" \
  -cp "${PLATFORM_JAR}" \
  "${WORK}/gen/com/soko/music/R.java" \
  $(find "${WORK}/src" -name "*.java")

# 7. Convert Classes to DEX with D8
echo "[3/5] Converting to DEX bytecode..."
"${D8}" --min-api 26 \
  --lib "${PLATFORM_JAR}" \
  --output "${WORK}/dex" \
  $(find "${WORK}/obj" -name "*.class")

# 8. Add DEX to APK
cd "${WORK}/dex"
zip -u "${WORK}/unaligned.apk" classes.dex

# 9. Align APK with Zipalign
echo "[4/5] Zipaligning APK..."
cd "${WORK}"
"${ZIPALIGN}" -p -f 4 "${WORK}/unaligned.apk" "${WORK}/aligned.apk"

# 10. Sign APK with apksigner
echo "[5/5] Signing APK with apksigner..."
FINAL_APK="${OUTPUT_DIR}/soko-music.apk"
"${APKSIGNER}" sign \
  --ks "${KEYSTORE}" \
  --ks-key-alias "soko-music-key" \
  --ks-pass "pass:${KEY_PASS}" \
  --key-pass "pass:${KEY_PASS}" \
  --out "${FINAL_APK}" \
  "${WORK}/aligned.apk"

# 11. Verify signature
"${APKSIGNER}" verify "${FINAL_APK}"

echo "=========================================================="
echo "🎉 SUCCESS: Soko Music APK generated at:"
echo "${FINAL_APK} ($(du -h "${FINAL_APK}" | cut -f1))"
echo "=========================================================="

rm -rf "${BUILD_DIR}"
