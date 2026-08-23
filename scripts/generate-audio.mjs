/**
 * @brief Pre-generates read-aloud audio for Devpedia chapters, using Piper (offline neural TTS,
 * free, no cloud/paid API) instead of the browser's live `speechSynthesis`. Solves a real bug:
 * iOS never recognizes `speechSynthesis` as a genuine media session, so Bluetooth/lock-screen
 * controls fall through to the last real media app instead of the site (confirmed on a real
 * iPhone, 22/08/2026).
 *
 * Reuses js/parser.js + js/reader.js's collectSegments() (exported for this purpose) against a
 * linkedom-parsed document, so the exact same reading plan (clauses, table narration, pronunciation
 * fixes from js/reader-pronunciation.js) is used for pre-generated audio as for live playback --
 * a single source of truth. Correcting a mispronunciation later means editing
 * js/reader-pronunciation.js as usual, then re-running this script for the affected chapters.
 *
 * One-time local setup (never committed, see .gitignore):
 *   python3 -m venv .venv-piper
 *   .venv-piper/bin/pip install piper-tts
 *   .venv-piper/bin/python -m piper.download_voices --download-dir .piper-voices \
 *       fr_FR-siwis-medium en_US-lessac-medium es_ES-davefx-medium pt_BR-faber-medium
 *
 * Usage:
 *   node scripts/generate-audio.mjs <chapter-id> [<chapter-id> ...]   # generate specific chapters
 *   node scripts/generate-audio.mjs --context=<id>[,<id>...]          # every chapter under these subject/category ids
 *   node scripts/generate-audio.mjs --all                              # generate the whole site
 *
 * Output, per chapter per language (never overwrites content/, only writes under audio/), namespaced
 * by category/subject folder like content/ itself -- a bare chapter id isn't unique site-wide (e.g.
 * "variables" exists under both `c` and `php`):
 *   audio/<lang>/<category folder>[/<subject folder>]/<chapter-id>.mp3    concatenated speech, in reading order
 *   audio/<lang>/<category folder>[/<subject folder>]/<chapter-id>.json  [{ kind: "speak", groupIndex, startMs, durationMs } |
 *                                                                          { kind: "pause", groupIndex, afterMs }, ...]
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseHTML } from "linkedom";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const PIPER_PYTHON = path.join(ROOT, ".venv-piper", "bin", "python");
const VOICES_DIR = path.join(ROOT, ".piper-voices");
const AUDIO_DIR = path.join(ROOT, "audio");

/* BCP-47 tag (cf. js/lang.js's BCP47_OVERRIDES) -> Piper voice name. "en-US" is what
   js/reader-pronunciation.js hardcodes for inline code needing an English voice, so it must
   resolve to the same voice as a plain "en" page. */
const LANG_TO_VOICE = {
    fr: "fr_FR-siwis-medium",
    en: "en_US-lessac-medium",
    "en-US": "en_US-lessac-medium",
    es: "es_ES-davefx-medium",
    "pt-BR": "pt_BR-faber-medium",
};

/* Internal site language code -> {contentDir, bcp47}, mirroring js/lang.js's own mapping. */
const SITE_LANGUAGES = {
    fr: { contentDir: "content", bcp47: "fr" },
    en: { contentDir: "content-en", bcp47: "en" },
    es: { contentDir: "content-es", bcp47: "es" },
    br: { contentDir: "content-br", bcp47: "pt-BR" },
};

const PAGE_SPECIFIC_CONTEXT = new Set(["sql", "le-terminal"]);

/**
 * @brief Sets up a linkedom document as reader.js/parser.js's expected browser globals, plus
 * small polyfills for what they need but linkedom doesn't provide.
 *
 * @returns {Document}
 */
function setupBrowserGlobals() {
    const { window, document, Node } = parseHTML("<!DOCTYPE html><html><body></body></html>");
    globalThis.window = window;
    globalThis.document = document;
    globalThis.Node = Node;
    // parser.js calls this for fenced code blocks; irrelevant to extracting spoken text.
    window.hljs = { highlightElement: () => {} };
    // reader.js reads/writes the persisted playback rate at module load time; unused here.
    globalThis.localStorage = { getItem: () => null, setItem: () => {} };
    // reader.js creates its shared <audio> element at module load time too; never played here.
    globalThis.Audio = function () { return document.createElement("audio"); };
    /* linkedom's Text has no splitText(), which collectLeafSegments() needs to cut a clause out
       mid-text-node. Standard DOM semantics: truncate this node, insert a new sibling with the
       remainder, return that sibling. */
    const textProto = Object.getPrototypeOf(document.createTextNode(""));
    textProto.splitText = function (offset) {
        const tail = this.textContent.slice(offset);
        this.textContent = this.textContent.slice(0, offset);
        const newNode = this.ownerDocument.createTextNode(tail);
        this.parentNode.insertBefore(newNode, this.nextSibling);
        return newNode;
    };
    return document;
}

/**
 * @brief Loads structure/struct{,-<lang>}.json for every site language.
 *
 * @returns {Object<string, Object>} keyed by internal lang code ("fr", "en", "es", "br")
 */
function loadStructures() {
    const structs = {};
    for (const lang of Object.keys(SITE_LANGUAGES)) {
        const suffix = lang === "fr" ? "" : `-${lang}`;
        structs[lang] = JSON.parse(fs.readFileSync(path.join(ROOT, "structure", `struct${suffix}.json`), "utf-8"));
    }
    return structs;
}

/**
 * @brief Flattens a struct.json into every chapter, with enough info to locate its markdown file
 * and resolve its reading context (cf. buildReadingPlan()'s own context logic in js/reader.js).
 *
 * @param {Object} struct one language's parsed struct*.json
 *
 * @returns {Array<{chapterId: string, mdPath: string, context: string, audioPath: string}>}
 */
function flattenChapters(struct, contentDir) {
    const chapters = [];
    struct.categories.filter(c => c.id !== "acceuil").forEach(category => {
        (category.subjects ?? [{ id: null, folder: null, chapters: category.chapters ?? [] }]).forEach(subject => {
            (subject.chapters ?? []).forEach(chapter => {
                const dirParts = [category.folder, subject.folder].filter(Boolean);
                const mdPath = path.join(ROOT, contentDir, ...dirParts, `${chapter.id}.md`);
                const context = PAGE_SPECIFIC_CONTEXT.has(chapter.id) ? chapter.id : (subject.id ?? category.id);
                // Mirrors content/'s own category/subject namespacing: a chapter id alone isn't
                // unique site-wide (e.g. "variables" under both `c` and `php`) -- cf. reader.js's
                // own chapterAudioPath() (Louis, 23/08/2026).
                const audioPath = path.join(...dirParts, chapter.id);
                chapters.push({ chapterId: chapter.id, mdPath, context, audioPath });
            });
        });
    });
    return chapters;
}

/**
 * @brief Builds the exact reading plan (clauses, table narration, pronunciation-corrected text)
 * for one chapter, reusing the live reader's own code.
 *
 * @param {string} mdPath
 * @param {string} bcp47 the page's language tag
 * @param {string} context subject or category id (or a PAGE_SPECIFIC_CONTEXT page id)
 * @param {string} chapterId
 *
 * @returns {Promise<Array>} the plan entries (same shape as js/reader.js's buildReadingPlan())
 */
async function buildPlanForChapter(mdPath, bcp47, context, chapterId) {
    const { parseMdContent, parseAppendText } = await import("../js/parser.js");
    const { collectSegments } = await import("../js/reader.js");
    const raw = fs.readFileSync(mdPath, "utf-8");
    const text = parseMdContent(raw);
    const pageDiv = document.createElement("div");
    document.body.appendChild(pageDiv);
    parseAppendText(pageDiv, chapterId, text);
    const entries = [];
    collectSegments(pageDiv, bcp47, context, chapterId, entries);
    pageDiv.remove();
    return entries;
}

/**
 * @brief Synthesizes every "speak" entry's text to "<outDir>/<entryIndex>.wav", grouped by voice
 * so each Piper voice model loads once regardless of how many entries use it (a chapter mixing
 * page-language prose with English-voice code spans still needs only 2 process spawns, not one
 * per clause -- reloading a ~60MB model per entry was the dominant cost of a naive approach).
 *
 * @param {Array} entries the full plan (both "speak" and "pause" entries; only "speak" is synthesized)
 * @param {string} outDir
 *
 * @returns {Map<number, number>} entry index -> duration in milliseconds
 */
function synthesizeEntries(entries, outDir) {
    const byVoice = new Map();
    entries.forEach((entry, index) => {
        if (entry.kind !== "speak") return;
        const voice = LANG_TO_VOICE[entry.lang] ?? LANG_TO_VOICE[entry.lang.split("-")[0]];
        if (!voice) throw new Error(`No Piper voice configured for lang "${entry.lang}"`);
        if (!byVoice.has(voice)) byVoice.set(voice, []);
        byVoice.get(voice).push({ index: String(index), text: entry.text });
    });

    const durations = new Map();
    for (const [voice, batch] of byVoice) {
        const modelPath = path.join(VOICES_DIR, `${voice}.onnx`);
        const configPath = path.join(VOICES_DIR, `${voice}.onnx.json`);
        const out = execFileSync(PIPER_PYTHON, [path.join(__dirname, "piper_batch.py"), modelPath, configPath, outDir], {
            input: JSON.stringify(batch),
            maxBuffer: 64 * 1024 * 1024,
        });
        out.toString().trim().split("\n").forEach(line => {
            const { index, durationMs } = JSON.parse(line);
            durations.set(Number(index), durationMs);
        });
    }
    return durations;
}

/**
 * @brief Generates the audio + timing JSON for one chapter in one language.
 *
 * @param {string} lang internal site language code ("fr", "en", "es", "br")
 * @param {{chapterId: string, mdPath: string, context: string, audioPath: string}} chapterInfo
 */
async function generateChapter(lang, { chapterId, mdPath, context, audioPath }) {
    if (!fs.existsSync(mdPath)) {
        console.warn(`  skip ${chapterId}: no ${mdPath}`);
        return;
    }
    const { bcp47 } = SITE_LANGUAGES[lang];
    const entries = await buildPlanForChapter(mdPath, bcp47, context, chapterId);

    const tmpDir = fs.mkdtempSync(path.join(ROOT, ".audio-tmp-"));
    const durations = synthesizeEntries(entries, tmpDir);

    const groupIndexOf = new Map();
    const timing = [];
    const concatList = [];
    let cumulativeMs = 0;

    entries.forEach((entry, i) => {
        const group = entry.kind === "speak" ? entry.group : entry.element;
        if (!groupIndexOf.has(group)) groupIndexOf.set(group, groupIndexOf.size);
        const groupIndex = groupIndexOf.get(group);

        if (entry.kind === "pause") {
            timing.push({ kind: "pause", groupIndex, afterMs: cumulativeMs });
            return;
        }
        const durationMs = durations.get(i);
        timing.push({ kind: "speak", groupIndex, startMs: cumulativeMs, durationMs });
        concatList.push(path.join(tmpDir, `${i}.wav`));
        cumulativeMs += durationMs;
    });

    const mp3Path = path.join(AUDIO_DIR, lang, `${audioPath}.mp3`);
    const jsonPath = path.join(AUDIO_DIR, lang, `${audioPath}.json`);
    fs.mkdirSync(path.dirname(mp3Path), { recursive: true });

    if (concatList.length > 0) {
        const listFile = path.join(tmpDir, "concat.txt");
        fs.writeFileSync(listFile, concatList.map(p => `file '${p}'`).join("\n"));
        execFileSync("ffmpeg", [
            "-y", "-hide_banner", "-loglevel", "warning", "-f", "concat", "-safe", "0", "-i", listFile,
            "-codec:a", "libmp3lame", "-b:a", "32k", "-ac", "1", "-ar", "22050",
            mp3Path,
        ], { stdio: ["ignore", "ignore", "inherit"] });
    }
    fs.writeFileSync(jsonPath, JSON.stringify(timing));
    fs.rmSync(tmpDir, { recursive: true, force: true });
    console.log(`  ${lang}/${audioPath}: ${concatList.length} clips, ${(cumulativeMs / 1000).toFixed(1)}s`);
}

async function main() {
    setupBrowserGlobals();
    const args = process.argv.slice(2);
    const generateAll = args.includes("--all");
    const contextArg = args.find(a => a.startsWith("--context="));
    // A bare chapter id isn't unique site-wide (cf. flattenChapters()'s own audioPath comment) --
    // requesting one by id alone would also pull in an unrelated subject's chapter of the same
    // name. --context restricts to chapters whose own subject/category id is in the given list,
    // for pregenerating everything under an already pronunciation-validated subject at once.
    const requestedContexts = contextArg ? new Set(contextArg.slice("--context=".length).split(",")) : null;
    const requestedIds = generateAll || requestedContexts ? null : new Set(args);
    if (!generateAll && !requestedContexts && requestedIds.size === 0) {
        console.error("Usage: node scripts/generate-audio.mjs <chapter-id> [...] | --context=<id>[,<id>...] | --all");
        process.exit(1);
    }

    const structs = loadStructures();
    for (const lang of Object.keys(SITE_LANGUAGES)) {
        const { contentDir } = SITE_LANGUAGES[lang];
        const chapters = flattenChapters(structs[lang], contentDir)
            .filter(c => generateAll || requestedContexts?.has(c.context) || requestedIds?.has(c.chapterId));
        if (chapters.length === 0) continue;
        console.log(`${lang}: ${chapters.length} chapter(s)`);
        for (const chapterInfo of chapters) {
            await generateChapter(lang, chapterInfo);
        }
    }
}

main();
