#!/bin/bash
set -e

echo "Copying Convex generated types..."

# Create output directory if it doesn't exist
mkdir -p src/convex

# Copy _generated directory from submodule
if [ -d "backend/convex/convex/_generated" ]; then
  cp -r backend/convex/convex/_generated src/convex/_generated
  echo "Convex types copied to src/convex/_generated/"
else
  echo "Error: backend/convex/convex/_generated not found"
  exit 1
fi
