#!/bin/bash
# Double-click this file to rebuild the app content from content_workbook.xlsx.
# (macOS will open it in Terminal and run the build.)

cd "$(dirname "$0")/.." || exit 1

echo "============================================"
echo " Building app content from the workbook..."
echo "============================================"
echo ""

# Make sure the one dependency is installed
python3 -c "import openpyxl" 2>/dev/null || {
  echo "Installing required library (openpyxl)..."
  pip3 install openpyxl --quiet --break-system-packages 2>/dev/null || pip3 install openpyxl --quiet
}

python3 content/build_appready.py
status=$?

echo ""
if [ $status -eq 0 ]; then
  echo "✅ Done! The app content is updated."
  echo "   Check the numbers above — any [TODO] or [WARN] lines need attention."
else
  echo "❌ Something went wrong. Send the messages above to the developer."
fi
echo ""
read -n 1 -s -r -p "Press any key to close this window..."
echo ""
