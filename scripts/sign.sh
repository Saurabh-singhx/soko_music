#!/usr/bin/env bash
set -e

# ==============================================================================
# Stage 4: Zipalign & Apksigner
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/env.sh"

# Ensure Keystore exists
if [ ! -f "${KEYSTORE}" ]; then
  mkdir -p "$(dirname "${KEYSTORE}")"
  echo "Generating persistent keystore at ${KEYSTORE}..."
  keytool -genkeypair -v \
    -keystore "${KEYSTORE}" \
    -alias "${KEY_ALIAS}" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "${KEY_PASS}" \
    -keypass "${KEY_PASS}" \
    -dname "CN=SokoMusic, OU=Mobile, O=Soko, L=San Francisco, ST=CA, C=US"
fi

echo "[4/4] Zipaligning & Signing APK..."
cd "${WORK}"
"${ZIPALIGN}" -p -f 4 "${WORK}/unaligned.apk" "${WORK}/aligned.apk"

FINAL_APK="${OUTPUT_DIR}/soko-music.apk"
"${APKSIGNER}" sign \
  --ks "${KEYSTORE}" \
  --ks-key-alias "${KEY_ALIAS}" \
  --ks-pass "pass:${KEY_PASS}" \
  --key-pass "pass:${KEY_PASS}" \
  --out "${FINAL_APK}" \
  "${WORK}/aligned.apk"

# Verify signature
"${APKSIGNER}" verify "${FINAL_APK}"

echo "=========================================================="
echo "🎉 SUCCESS: Soko Music APK generated at:"
echo "${FINAL_APK} ($(du -h "${FINAL_APK}" | cut -f1))"
echo "=========================================================="
