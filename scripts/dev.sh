#!/usr/bin/env bash
# Regenerates structure/struct.json from content/, then starts a local server.
set -e

cd "$(dirname "$0")/.."

if command -v node >/dev/null 2>&1; then
    echo "Génération de structure/struct.json à partir de content/..."
    node scripts/generate-struct.js
else
    echo "Node introuvable : structure/struct.json n'a pas été régénéré (le fichier existant sera utilisé)." >&2
fi

echo "Démarrage du serveur local sur http://localhost:8000 ..."
python3 -m http.server
