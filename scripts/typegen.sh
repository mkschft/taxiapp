#!/bin/bash
set -e

echo "Running type generation..."

# Generate API types from OpenAPI
bash scripts/typegen-api.sh

# Copy Convex generated types
bash scripts/typegen-convex.sh

echo "All types generated successfully!"
