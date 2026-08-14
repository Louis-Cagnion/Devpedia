#!/usr/bin/env node
/**
 * One-off correction pass: content-br/ was translated using European Portuguese
 * vocabulary/spelling despite being labelled "Português (Brasil)". Rewrites every
 * known EU-only term to its Brazilian equivalent, in place, across all of content-br/.
 * Kept as a safety net for any future content-br addition drafted from a European
 * Portuguese source (e.g. a copy-adapted machine translation).
 *
 * Word-boundary matching uses an explicit Portuguese letter class (not \b, which is
 * ASCII-only in JS and would mis-place boundaries around accented characters like ã/ç).
 * Case of the first letter is preserved so mid-sentence and sentence-initial matches
 * both come out correctly capitalized.
 *
 * Run with: node scripts/fix-br-vocabulary.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listMarkdownFilesRecursive } from "./markdown-segmenter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const TARGET_CONTENT_DIR = path.join(ROOT, "content-br");

const PT_LETTER = "A-Za-zÀ-ÖØ-öø-ÿ";

// [European form, Brazilian replacement] — replacement's first letter is
// re-capitalized to match the matched form, so only lowercase forms are listed.
const TERMS = [
    ["ficheiros", "arquivos"],
    ["ficheiro", "arquivo"],
    ["utilizadores", "usuários"],
    ["utilizador", "usuário"],
    ["ecrãs", "telas"],
    ["ecrã", "tela"],
    ["ratos", "mouses"],
    ["rato", "mouse"],
    ["telemóveis", "celulares"],
    ["telemóvel", "celular"],
    ["palavras-passe", "senhas"],
    ["palavra-passe", "senha"],
    ["predefinições", "padrão"],
    ["predefinição", "padrão"],
    ["predefinidas", "padrão"],
    ["predefinidos", "padrão"],
    ["predefinida", "padrão"],
    ["predefinido", "padrão"],
    ["morada", "endereço"],
    ["registo", "registro"],
    ["contacto", "contato"],
    ["descarregar", "baixar"],
    ["controlo", "controle"],
    // "aceder" (EU, -er verb) -> "acessar" (BR, -ar verb): conjugated forms differ,
    // so each form is mapped explicitly rather than swapped by a shared stem.
    ["aceder", "acessar"],
    ["acedem", "acessam"],
    ["acedido", "acessado"],
    ["acede", "acessa"],
    ["aceda", "acesse"],
];

function withPreservedCase(matched, replacement) {
    if (matched[0] === matched[0].toUpperCase())
        return replacement[0].toUpperCase() + replacement.slice(1);
    return replacement;
}

function rewriteFile(filePath) {
    const original = fs.readFileSync(filePath, "utf-8");
    let text = original;
    for (const [euForm, brForm] of TERMS) {
        const pattern = new RegExp(`(?<![${PT_LETTER}])(${euForm})(?![${PT_LETTER}])`, "gi");
        text = text.replace(pattern, matched => withPreservedCase(matched, brForm));
    }
    if (text === original)
        return false;
    fs.writeFileSync(filePath, text, "utf-8");
    console.log(`  ✓ ${path.relative(TARGET_CONTENT_DIR, filePath)}`);
    return true;
}

const files = listMarkdownFilesRecursive(TARGET_CONTENT_DIR);
console.log(`Rewriting EU-PT vocabulary to BR-PT across ${files.length} file(s) in content-br/...`);
const changed = files.filter(rewriteFile).length;
console.log(`Done. ${changed} file(s) updated, ${files.length - changed} already clean.`);
