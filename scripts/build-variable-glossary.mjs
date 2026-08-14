#!/usr/bin/env node
/**
 * Builds scripts/variable-glossary.json: a French -> per-language mapping for the
 * recurring example variable/identifier names used across content/'s code blocks
 * (fichier, resultat, tableau, utilisateur...). scripts/markdown-segmenter.mjs's
 * segmentBody() uses this to rename identifiers consistently in translated content,
 * instead of leaving them in French or risking an inconsistent rename per file.
 *
 * Run with: node scripts/build-variable-glossary.mjs
 * Requires a DEEPL_API_KEY in a local .env file (untracked — see .gitignore).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUTPUT_PATH = path.join(ROOT, "scripts", "variable-glossary.json");

// Curated from the actual identifiers most frequently reused across content/'s code
// examples (extracted by frequency analysis). Only recurring, generic example names —
// one-off/unique identifiers are left in French rather than risk an inconsistent rename.
const FRENCH_WORDS = [
    "nom", "age", "valeur", "valeurs", "fichier", "erreur", "tableau", "element",
    "donnees", "nombre", "nombres", "liste", "ligne", "modele", "personne", "fruit",
    "fruits", "resultat", "compteur", "cle", "dossier", "solde", "utilisateur",
    "message", "texte", "total", "titre", "animal", "ville", "marque", "racine",
    "programme", "sortie", "contenu", "quantite", "prix", "produit", "requete",
    "reponse", "chaine", "objet", "cible", "source", "entree", "config", "groupe",
    "chemin", "champ", "cache", "colonne", "index", "indice",
];

const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "br", label: "Português (Brasil)" },
    { code: "de", label: "Deutsch" },
    { code: "ru", label: "Русский" },
    { code: "zh", label: "中文（简体）" },
    { code: "ar", label: "العربية" },
    { code: "id", label: "Bahasa Indonesia" },
    { code: "ja", label: "日本語" },
];

function readEnvFile() {
    const envPath = path.join(ROOT, ".env");
    if (!fs.existsSync(envPath)) return {};
    const env = {};
    fs.readFileSync(envPath, "utf-8").split("\n").forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const sepIndex = trimmed.indexOf("=");
        if (sepIndex === -1) return;
        env[trimmed.slice(0, sepIndex).trim()] = trimmed.slice(sepIndex + 1).trim();
    });
    return env;
}

const env = { ...readEnvFile(), ...process.env };
const DEEPL_API_KEY = env.DEEPL_API_KEY;
if (!DEEPL_API_KEY) {
    console.error("Missing DEEPL_API_KEY. Create a .env file at the project root with:\nDEEPL_API_KEY=your_key_here");
    process.exit(1);
}
const DEEPL_URL = DEEPL_API_KEY.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";

async function translateWordList(targetLang, attempt = 1) {
    const body = new URLSearchParams();
    body.append("target_lang", targetLang.toUpperCase());
    body.append("source_lang", "FR");
    body.append("context", "Liste de noms de variables utilisés dans des exemples de code informatique — traduire chaque mot par l'identifiant de variable le plus naturel dans ce contexte de programmation, en un seul mot si possible.");
    FRENCH_WORDS.forEach(word => body.append("text", word));

    const response = await fetch(DEEPL_URL, {
        method: "POST",
        headers: { Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}` },
        body
    });
    if (response.status === 429 && attempt <= 5) {
        const delayMs = attempt * 3000;
        console.log(`  … rate-limited, retrying in ${delayMs / 1000}s`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return translateWordList(targetLang, attempt + 1);
    }
    if (!response.ok)
        throw new Error(`DeepL API error ${response.status}: ${await response.text()}`);
    const data = await response.json();
    return data.translations.map(t => t.text);
}

/** @returns {string} a valid identifier: lowercased, spaces/punctuation to underscores */
function toIdentifier(word) {
    return word
        .trim()
        .toLowerCase()
        .replace(/['’]/g, "")
        .replace(/[^\p{L}\p{N}]+/gu, "_")
        .replace(/^_+|_+$/g, "");
}

async function main() {
    const glossary = {};
    FRENCH_WORDS.forEach(word => { glossary[word] = {}; });

    for (const { code, label } of LANGUAGES) {
        console.log(`Translating variable glossary to ${label} (${code})...`);
        const translations = await translateWordList(code);
        FRENCH_WORDS.forEach((word, i) => {
            glossary[word][code] = toIdentifier(translations[i]);
        });
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(glossary, null, 2) + "\n", "utf-8");
    console.log(`Wrote ${Object.keys(glossary).length} entries to scripts/variable-glossary.json`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
