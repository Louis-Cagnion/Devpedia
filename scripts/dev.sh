#!/usr/bin/env bash
# Regenerates structure/struct.json from content/, then starts a local server.
set -e

cd "$(dirname "$0")/.."

echo "Génération de structure/struct.json à partir de content/..."
node scripts/generate-struct.js

echo "Démarrage du serveur local sur http://localhost:8000 ..."
python3 -m http.server
