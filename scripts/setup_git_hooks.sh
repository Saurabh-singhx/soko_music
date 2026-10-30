#!/usr/bin/env bash
# ==============================================================================
# Soko Music Git Hooks Setup
# Installs a strict pre-commit hook to prevent sensitive secrets from being committed.
# ==============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOKS_DIR="${PROJECT_ROOT}/.git/hooks"
PRE_COMMIT_HOOK="${HOOKS_DIR}/pre-commit"

if [ ! -d "${HOOKS_DIR}" ]; then
  echo "⚠️ Not a git repository or .git/hooks directory not found."
  exit 0
fi

echo "🔒 Installing security pre-commit hook in ${PRE_COMMIT_HOOK}..."

cat << 'EOF' > "${PRE_COMMIT_HOOK}"
#!/usr/bin/env bash
# ==============================================================================
# Soko Music Security Pre-Commit Hook
# Blocks sensitive files and credentials from being committed to version control.
# ==============================================================================

set -e

# 1. Check staged filenames against forbidden patterns
FORBIDDEN_FILE_PATTERNS=(
  '^\.env(\..+)?$'
  '.*\.keystore$'
  '.*\.jks$'
  '.*\.key$'
  '.*\.p12$'
  '.*\.pem$'
  '.*\.pk8$'
  '.*\.pfx$'
  '.*credentials.*\.json$'
  '.*secret.*\.json$'
  '.*google-services\.json$'
  '.*token.*\.json$'
  '^\.git-credentials$'
  '^\.netrc$'
  '.*session_cookies.*'
)

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -n "${STAGED_FILES}" ]; then
  while IFS= read -r file; do
    filename="$(basename "${file}")"
    # Allow safe templates
    if [[ "${filename}" == *".example"* || "${filename}" == *".sample"* ]]; then
      continue
    fi

    for pattern in "${FORBIDDEN_FILE_PATTERNS[@]}"; do
      if [[ "${filename}" =~ ${pattern} ]]; then
        echo ""
        echo "❌ [SECURITY ERROR] Commit blocked: sensitive file staged for commit!"
        echo "   File: ${file}"
        echo "   Rule: Matched forbidden pattern '${pattern}'"
        echo "   Fix : Run 'git reset HEAD \"${file}\"' and ensure it is in .gitignore."
        echo ""
        exit 1
      fi
    done
  done <<< "${STAGED_FILES}"
fi

# 2. Check staged content diff for known credential patterns
STAGED_DIFF=$(git diff --cached -U0)

if [ -n "${STAGED_DIFF}" ]; then
  # Check for GitHub tokens (Classic or Fine-grained)
  if echo "${STAGED_DIFF}" | grep -E '^\+[^+]' | grep -qE 'ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{50,}'; then
    echo ""
    echo "❌ [SECURITY ERROR] Commit blocked: GitHub Personal Access Token detected in staged changes!"
    echo "   Never commit personal access tokens to version control."
    echo "   Store tokens in GitHub Repository Secrets (e.g. GIST_TOKEN) instead."
    echo ""
    exit 1
  fi

  # Check for Private Key Headers (-- required to prevent grep treating - as flag)
  if echo "${STAGED_DIFF}" | grep -E '^\+[^+]' | grep -qE -- '-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----'; then
    echo ""
    echo "❌ [SECURITY ERROR] Commit blocked: Private key header detected in staged changes!"
    echo "   Store private keys in environment variables or GitHub Secrets."
    echo ""
    exit 1
  fi

  # Check for Google API Keys
  if echo "${STAGED_DIFF}" | grep -E '^\+[^+]' | grep -qE 'AIza[0-9A-Za-z\-_]{35}'; then
    echo ""
    echo "❌ [SECURITY ERROR] Commit blocked: Google API Key detected in staged changes!"
    echo ""
    exit 1
  fi

  # Check for legacy hardcoded keystore passwords (pattern obfuscated to prevent self-match)
  LEGACY_PASS_REGEX="soko""music""123"
  if echo "${STAGED_DIFF}" | grep -E '^\+[^+]' | grep -F -v "LEGACY_PASS_REGEX" | grep -q "${LEGACY_PASS_REGEX}"; then
    echo ""
    echo "❌ [SECURITY ERROR] Commit blocked: Hardcoded keystore password detected in staged changes!"
    echo ""
    exit 1
  fi
fi

exit 0
EOF

chmod +x "${PRE_COMMIT_HOOK}"
echo "✅ Security pre-commit hook successfully installed and active."
