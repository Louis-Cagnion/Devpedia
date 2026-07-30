#!/usr/bin/env node
/**
 * One-off fixer: retranslates specific (word, lang) entries in
 * scripts/variable-glossary.json that came back untranslated (identical to the French
 * source) or corrupted by an earlier flawed extraction attempt. Sends the bare word alone
 * per API call (no wrapper sentence) so the response IS the translation, nothing to parse.
 *
 * Run with: node scripts/fix-variable-glossary.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const GLOSSARY_PATH = path.join(ROOT, "scripts", "variable-glossary.json");

const RETRY_PAIRS = [
    ["fruit", "ru"], ["fruit", "zh"], ["fruit", "ar"], ["fruit", "ja"],
    ["fruits", "ru"], ["fruits", "ar"], ["fruits", "ja"],
    ["resultat", "ru"],
    ["message", "de"], ["message", "zh"], ["message", "ja"],
    ["total", "ru"], ["total", "zh"], ["total", "ja"],
    ["animal", "ru"], ["animal", "ja"],
    ["âge", "ru"], ["âge", "zh"], ["âge", "ja"],
    ["élément", "de"], ["élément", "ru"], ["élément", "zh"], ["élément", "ar"], ["élément", "id"], ["élément", "ja"],
    ["clé", "zh"], ["clé", "ar"], ["clé", "ja"],
    ["entrée", "de"], ["entrée", "ru"], ["entrée", "zh"], ["entrée", "ar"], ["entrée", "id"], ["entrée", "ja"],
    ["quantité", "de"], ["quantité", "ru"], ["quantité", "ja"],
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
    console.error("Missing DEEPL_API_KEY.");
    process.exit(1);
}
const DEEPL_URL = DEEPL_API_KEY.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";

async function translateOne(word, targetLang, attempt = 1) {
    const body = new URLSearchParams();
    body.append("target_lang", targetLang.toUpperCase());
    body.append("source_lang", "FR");
    body.append("text", word);

    const response = await fetch(DEEPL_URL, {
        method: "POST",
        headers: { Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}` },
        body
    });
    if (response.status === 429 && attempt <= 5) {
        await new Promise(resolve => setTimeout(resolve, attempt * 3000));
        return translateOne(word, targetLang, attempt + 1);
    }
    if (!response.ok)
        throw new Error(`DeepL API error ${response.status}: ${await response.text()}`);
    const data = await response.json();
    return data.translations[0].text.trim();
}

function toIdentifier(word) {
    return word
        .trim()
        .toLowerCase()
        .replace(/['’]/g, "")
        .replace(/[^\p{L}\p{N}]+/gu, "_")
        .replace(/^_+|_+$/g, "");
}

async function main() {
    const glossary = JSON.parse(fs.readFileSync(GLOSSARY_PATH, "utf-8"));

    for (const [word, lang] of RETRY_PAIRS) {
        const translated = await translateOne(word, lang);
        const identifier = toIdentifier(translated);
        console.log(`${word} -> ${lang}: "${translated}" (${identifier})`);
        glossary[word][lang] = identifier;
        await new Promise(resolve => setTimeout(resolve, 400));
    }

    fs.writeFileSync(GLOSSARY_PATH, JSON.stringify(glossary, null, 2) + "\n", "utf-8");
    console.log("Glossary fixed.");
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
