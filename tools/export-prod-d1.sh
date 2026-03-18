#!/usr/bin/env bash
# Export production D1 database to a SQL file for seed derivation or backup.
# Requires: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN (or wrangler login).
# Usage: from repo root, run:
#   bash tools/export-prod-d1.sh
# Output: apps/web/tools/prod-export.sql (gitignored). Then run seed-from-prod
# or manually normalize (anonymize, stable IDs, proof_image_url → seed/*.png).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/../apps/web" && pwd)"
OUTPUT_FILE="${APP_DIR}/tools/prod-export.sql"
DB_NAME="napkinbets-db"

mkdir -p "$(dirname "$OUTPUT_FILE")"

echo "Exporting D1 database '${DB_NAME}' (remote) to ${OUTPUT_FILE}..."
cd "$APP_DIR"
pnpm exec wrangler d1 export "$DB_NAME" --remote --output="$OUTPUT_FILE"

echo "Done. Next: normalize into seed (anonymize PII, stable IDs, map proof_image_url to seed/venmo-*.png)."
