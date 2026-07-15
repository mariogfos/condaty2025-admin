#!/bin/bash
# ================================================================================
# pre-commit-check-rules.sh
# Hook de pre-commit para verificar reglas de la agencia Makromania
# Uso: bash pre-commit-check-rules.sh {app_path}
#
# Regenerado 2026-07-15 (Mavis, out-of-cycle Condaty). Cambios vs. versión
# eliminada el 2026-06-06:
#   - BASE_PATH ya no está hardcodeado; usa el directorio padre del repo
#     detectado vía `git rev-parse --show-toplevel`.
#   - Alertas de Telegram opcionales: si TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID
#     no están en el entorno, se omiten silenciosamente (CI no rompe).
#   - Filtra paths `.makromania/`, `.agent/`, `vendor/`, `node_modules/`
#     para evitar auto-falsos positivos.
# ================================================================================

set -euo pipefail

# Colores (desactivados si no es TTY, e.g. CI)
if [ -t 1 ]; then
    RED='\033[0;31m'
    YELLOW='\033[0;33m'
    GREEN='\033[0;32m'
    NC='\033[0m'
else
    RED=''; YELLOW=''; GREEN=''; NC=''
fi

# Detectar BASE_PATH desde el repo actual
if BASE_PATH=$(git rev-parse --show-toplevel 2>/dev/null); then
    : # ok
else
    BASE_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi

# Cargar variables de entorno si existe .env en el repo (best-effort).
# Algunos .env de Next.js tienen sintaxis no-bash (espacios alrededor de '='
# o comillas), por eso se hace best-effort y se continúa si falla.
if [ -f "${BASE_PATH}/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    (source "${BASE_PATH}/.env" 2>/dev/null) || true
    set +a
fi

# App path (default: directorio actual)
APP_PATH="${1:-.}"

# Convertir a absoluto
if [[ "$APP_PATH" != /* ]]; then
    APP_PATH="$BASE_PATH/$APP_PATH"
fi

# Cambiar al directorio del proyecto
cd "$APP_PATH" || { echo -e "${RED}[ERROR]${NC} No se pudo acceder a $APP_PATH"; exit 1; }

# Funciones de output
error() { echo -e "${RED}[ERROR]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
info() { echo -e "${GREEN}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[PASS]${NC} $1"; }

# Alerta opcional a Telegram (skip silencioso si no hay vars)
send_alert() {
    local severity="$1"
    local rule="$2"
    local file="$3"
    local details="$4"

    if [ -z "${TELEGRAM_BOT_TOKEN:-}" ] || [ -z "${TELEGRAM_CHAT_ID:-}" ]; then
        return 0
    fi

    local text="${severity} | ${rule} | ${file} | ${details}"
    curl -sS -X POST \
        "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d "chat_id=${TELEGRAM_CHAT_ID}" \
        -d "text=${text}" >/dev/null 2>&1 || true
}

ERRORS=0
WARNINGS=0

echo "=============================================="
echo "  Makromania Agency - Pre-commit Check Rules"
echo "=============================================="
echo ""

# Detectar archivos staged
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)
STAGED_FILES="$STAGED_FILES $(git ls-files --others --exclude-standard 2>/dev/null || true)"

# Filtrar: excluir paths de meta (la agencia los pinean en otra location)
STAGED_FILES=$(echo "$STAGED_FILES" \
    | grep -v "^.makromania/" \
    | grep -v "^.agent/" \
    | grep -v "/vendor/" \
    | grep -v "/node_modules/" \
    | grep -v "\.makromania/" \
    | tr '\n' ' ')

if [ -z "$(echo "$STAGED_FILES" | xargs)" ]; then
    info "No hay archivos en staging. Nada que verificar."
    exit 0
fi

echo "Archivos a verificar: $(echo $STAGED_FILES | wc -w | tr -d ' ')"
echo ""

# ================================================================================
# REGLA 1: R-P-007 — Prohibir Cache::forget() directo
# ================================================================================
echo "--- Regla 1: Buscando Cache::forget() en PHP ---"
CACHE_FORGET_FILES=$(echo "$STAGED_FILES" | xargs grep -l "Cache::forget" 2>/dev/null || true)
if [ -n "$CACHE_FORGET_FILES" ]; then
    for file in $CACHE_FORGET_FILES; do
        error "Cache::forget() encontrado en: $file"
        grep -n "Cache::forget" "$file" | head -3 | sed 's/^/    /'
        send_alert "HIGH" "R-P-007" "$file" "Used Cache::forget() instead of Cache::tags()"
        ERRORS=$((ERRORS + 1))
    done
else
    success "No se encontró Cache::forget()"
fi
echo ""

# ================================================================================
# REGLA 2: Hardcoded values (WARNING)
# ================================================================================
echo "--- Regla 2: Buscando hardcoded values ---"
HARDCODED_PATTERNS=(
    "=[0-9]{6,}"
    "['\"][0-9a-f]{32}['\"]"
    "base_path\(\)"
)

for pattern in "${HARDCODED_PATTERNS[@]}"; do
    HARDCODED_FILES=$(echo "$STAGED_FILES" | xargs grep -En "$pattern" 2>/dev/null | grep "\.php:" || true)
    if [ -n "$HARDCODED_FILES" ]; then
        while IFS= read -r line; do
            file=$(echo "$line" | cut -d: -f1)
            linenum=$(echo "$line" | cut -d: -f2)
            content=$(echo "$line" | cut -d: -f3-)
            warning "Posible hardcoded en $file:$linenum — $content"
            WARNINGS=$((WARNINGS + 1))
        done <<< "$HARDCODED_FILES"
    fi
done

if [ $WARNINGS -eq 0 ]; then
    success "No se encontraron hardcoded values obvios"
fi
echo ""

# ================================================================================
# REGLA 3: Test coverage (WARNING)
# ================================================================================
echo "--- Regla 3: Verificando coverage de tests ---"
PHP_FILES=$(echo "$STAGED_FILES" | grep "\.php$" | grep -v "Test\.php$" | grep -v "/tests/" || true)
for php_file in $PHP_FILES; do
    basename="${php_file##*/}"
    filename="${basename%.*}"

    test_paths=(
        "tests/Unit/${filename}Test.php"
        "tests/Feature/${filename}Test.php"
        "tests/Unit/$(dirname "$php_file")/${filename}Test.php"
    )

    test_found=false
    for test_path in "${test_paths[@]}"; do
        if [ -f "$test_path" ]; then
            test_found=true
            break
        fi
    done

    if [ "$test_found" = false ]; then
        warning "No se encontró test para: $php_file"
        WARNINGS=$((WARNINGS + 1))
    fi
done

if [ $WARNINGS -eq 0 ]; then
    success "Todos los archivos tienen tests asociados"
fi
echo ""

# ================================================================================
# REGLA 4: R-S-001 — Secrets hardcoded (ERROR)
# ================================================================================
echo "--- Regla 4: Buscando posibles secrets hardcoded ---"
SECRET_PATTERNS=(
    "api_key[[:space:]]*="
    "secret_key[[:space:]]*="
    "password[[:space:]]*=[[:space:]]*['\"]"
    "token[[:space:]]*=[[:space:]]*['\"][0-9a-zA-Z]{20,}"
)

for pattern in "${SECRET_PATTERNS[@]}"; do
    SECRET_FILES=$(echo "$STAGED_FILES" | grep "\.php$" | xargs grep -El "$pattern" 2>/dev/null || true)
    if [ -n "$SECRET_FILES" ]; then
        for file in $SECRET_FILES; do
            if [[ "$file" != *".env.example"* ]] && [[ "$file" != *"config/"* ]]; then
                error "Posible secret en: $file"
                send_alert "HIGH" "R-S-001" "$file" "Possible hardcoded secret detected"
                ERRORS=$((ERRORS + 1))
            fi
        done
    fi
done
echo ""

# ================================================================================
# RESUMEN
# ================================================================================
echo "=============================================="
echo "  RESUMEN"
echo "=============================================="
echo -e "Errors:   ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    error "ERRORS encontrados. Commit BLOQUEADO."
    error "Corrige los errores antes de commitear."
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    warning "Warnings encontrados. Commit permitido pero no recomendado."
    echo "Para forzar el commit usa: git commit --no-verify"
    exit 0
else
    success "Todas las verificaciones pasaron."
    exit 0
fi
