#!/bin/bash
set -e

echo "Generating API types from OpenAPI spec..."

# Create output directory if it doesn't exist
mkdir -p src/lib

# Fetch OpenAPI spec to temp file
TEMP_SPEC=$(mktemp /tmp/openapi-spec-XXXXXX.yaml)
curl -sL https://api.taxipilot.fi/api/v1/openapi.yaml -o "$TEMP_SPEC"

# Run openapi-typescript
npx openapi-typescript "$TEMP_SPEC" -o src/lib/api-types.ts

# Clean up temp file
rm "$TEMP_SPEC"

echo "API types generated at src/lib/api-types.ts"
