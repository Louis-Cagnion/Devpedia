#!/usr/bin/env node
/**
 * Scans a content directory and (re)generates its struct.json to match what's on disk.
 *
 * Run with: node scripts/generate-struct.js
 * (also importable — see buildStruct/writeStruct — used by translate-content.mjs to build
 * a struct.json for each translated content-<lang>/ directory)
 *
 * Conventions this relies on (matching how content/ is authored):
 * - <content>/acceuil.md is the home page, always mapped to the fixed "acceuil" category.
 * - a category is a top-level folder under <content>. It has a description.md.
 * - if a category folder contains subfolders, each subfolder is a "subject" (e.g. C, C++, PHP)
 *   and its own chapters are the .md files directly inside it.
 * - if a category folder has no subfolders, its .md files (except description.md) are its
 *   chapters directly (e.g. Bash, Git).
 * - a subject's own description page is the .md file inside it whose first line (a `# Title`
 *   heading) matches the subject folder name (case-insensitive) — e.g. cpp.md titled "C++"
 *   inside the "C++" folder. The rest of the .md files in that folder are its chapters.
 * - a file's title is its first line, a `# Title` markdown heading — not frontmatter.
 * - an optional `---`-fenced frontmatter block may precede that heading, holding build-time
 *   metadata only (currently just `order`, an integer used to sort chapters).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CONTENT_DIR = path.join(__dirname, "..", "content");
const DEFAULT_STRUCT_PATH = path.join(__dirname, "..", "structure", "struct.json");

/**
 * @param {string} filePath
 * @returns {string} the markdown body (frontmatter, if any, stripped off)
 */
function readBody(filePath) {
    const raw = fs.readFileSync(filePath, "utf-8");
    return raw.startsWith("---") ? raw.split("---").slice(2).join("---").trim() : raw.trim();
}

/**
 * @param {string} filePath
 * @returns {Object<string, string>} the optional frontmatter's `key: value` pairs
 */
function readFrontmatter(filePath) {
    const raw = fs.readFileSync(filePath, "utf-8");
    const fields = {};
    if (!raw.startsWith("---")) return fields;
    const yaml = raw.split("---")[1].trim();
    yaml.split("\n").forEach(line => {
        const sepIndex = line.indexOf(": ");
        if (sepIndex === -1) return;
        fields[line.slice(0, sepIndex).trim()] = line.slice(sepIndex + 2).trim();
    });
    return fields;
}

/**
 * @param {string} filePath
 * @returns {string} the file's title — its first line, a `# Title` heading
 */
function readTitle(filePath) {
    const firstLine = readBody(filePath).split("\n")[0];
    const match = firstLine.match(/^#\s+(.*)/);
    return match ? match[1].trim() : firstLine.trim();
}

/**
 * @param {string} name
 * @returns {string} a kebab-case id
 */
function slugify(name) {
    return name
        // Décompose chaque lettre accentuée en "lettre + accent", puis retire les
        // accents : sans cette étape, "Représentation" donnerait "repr-sentation",
        // les accents n'étant pas dans [a-z0-9].
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function listMarkdownFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true })
        .filter(entry => entry.isFile() && entry.name.endsWith(".md"))
        .map(entry => entry.name)
        .sort();
}

function listSubdirectories(dir) {
    return fs.readdirSync(dir, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .sort();
}

/**
 * Chapters are ordered from most fundamental to most niche/advanced using each file's
 * `order` frontmatter field (a small integer, unique within its folder). Files without
 * an `order` field are pushed to the end, in their alphabetical (filename) order.
 *
 * @param {string} dir
 * @param {string[]} fileNames
 * @returns {Array<{id: string, label: string}>}
 */
function buildChapterList(dir, fileNames) {
    const chapters = fileNames.map(fileName => {
        const filePath = path.join(dir, fileName);
        const order = readFrontmatter(filePath).order;
        return {
            id: fileName.slice(0, -3),
            label: readTitle(filePath),
            order: order === undefined ? null : Number(order)
        };
    });
    chapters.sort((a, b) => {
        if (a.order === null && b.order === null) return 0;
        if (a.order === null) return 1;
        if (b.order === null) return -1;
        return a.order - b.order;
    });
    return chapters.map(({id, label}) => ({id, label}));
}

/**
 * @param {string} categoryDir
 * @param {string} subjectFolder
 */
function buildSubject(categoryDir, subjectFolder) {
    const subjectDir = path.join(categoryDir, subjectFolder);
    const files = listMarkdownFiles(subjectDir);
    const mainFile = files.find(fileName =>
        readTitle(path.join(subjectDir, fileName)).toLowerCase() === subjectFolder.toLowerCase()
    );
    if (!mainFile) {
        console.warn(`Aucun fichier principal trouvé pour le sujet "${subjectFolder}" (aucun titre ne correspond au nom du dossier) ; tous ses fichiers seront listés comme chapitres.`);
    }
    const chapterFiles = files.filter(fileName => fileName !== mainFile);
    return {
        id: mainFile ? mainFile.slice(0, -3) : slugify(subjectFolder),
        label: subjectFolder,
        folder: subjectFolder,
        chapters: buildChapterList(subjectDir, chapterFiles)
    };
}

/**
 * @param {string} contentDir
 * @param {string} categoryFolder
 */
function buildCategory(contentDir, categoryFolder) {
    const categoryDir = path.join(contentDir, categoryFolder);
    const subjectFolders = listSubdirectories(categoryDir);
    const category = {
        id: slugify(categoryFolder),
        label: categoryFolder,
        folder: categoryFolder
    };
    if (subjectFolders.length > 0) {
        category.subjects = subjectFolders.map(subjectFolder => buildSubject(categoryDir, subjectFolder));
    } else {
        const chapterFiles = listMarkdownFiles(categoryDir).filter(fileName => fileName !== "description.md");
        category.chapters = buildChapterList(categoryDir, chapterFiles);
    }
    return category;
}

/** Matches internal chapter links as written in .md files, e.g. "/?c=git&s=bash&p=stash" or,
 *  for categories without subjects, "/?c=git&p=stash". */
const INTERNAL_LINK_PATTERN = /\/\?c=([a-z0-9-]+)(?:&s=([a-z0-9-]+))?&p=([a-z0-9-]+)/g;

/**
 * @param {{categories: Array}} struct
 * @returns {Map<string, {chapters: Set<string>, subjects: Map<string, Set<string>>}>}
 *   valid chapter/subject ids per category id, for validating internal links against
 */
function indexStructForLinkLookup(struct) {
    const index = new Map();
    for (const category of struct.categories) {
        const subjects = new Map();
        for (const subject of category.subjects ?? []) {
            subjects.set(subject.id, new Set(subject.chapters.map(chapter => chapter.id)));
        }
        index.set(category.id, { chapters: new Set((category.chapters ?? []).map(chapter => chapter.id)), subjects });
    }
    return index;
}

/**
 * Walks every .md file under contentDir and validates each internal "?c=...&s=...&p=..." link
 * against the freshly built struct. Without this, renaming a category/subject folder (which
 * changes its slugified id) silently breaks every link pointing to it — no error anywhere on
 * the site, the broken chapter just never opens.
 * @param {string} contentDir
 * @param {{categories: Array}} struct
 * @throws {Error} listing every broken link found (file + link), if any
 */
function validateInternalLinks(contentDir, struct) {
    const index = indexStructForLinkLookup(struct);
    const broken = [];

    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const entryPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(entryPath);
                continue;
            }
            if (!entry.isFile() || !entry.name.endsWith(".md")) continue;

            const text = fs.readFileSync(entryPath, "utf-8");
            for (const [link, categoryId, subjectId, chapterId] of text.matchAll(INTERNAL_LINK_PATTERN)) {
                const category = index.get(categoryId);
                if (!category) {
                    broken.push(`${entryPath} -> ${link} (catégorie "${categoryId}" introuvable)`);
                } else if (subjectId) {
                    const subjectChapters = category.subjects.get(subjectId);
                    if (!subjectChapters) {
                        broken.push(`${entryPath} -> ${link} (sujet "${subjectId}" introuvable dans "${categoryId}")`);
                    } else if (chapterId !== subjectId && !subjectChapters.has(chapterId)) {
                        // p=<subjectId> (same value as s=) links to the subject's own intro page
                        // (its "main file", excluded from `chapters` — see buildSubject), not a chapter.
                        broken.push(`${entryPath} -> ${link} (chapitre "${chapterId}" introuvable dans le sujet "${subjectId}")`);
                    }
                } else if (!category.chapters.has(chapterId)) {
                    broken.push(`${entryPath} -> ${link} (chapitre "${chapterId}" introuvable dans "${categoryId}")`);
                }
            }
        }
    };
    walk(contentDir);

    if (broken.length > 0) {
        throw new Error(`${broken.length} lien(s) interne(s) cassé(s) :\n` + broken.map(line => `  - ${line}`).join("\n"));
    }
}

/**
 * @param {string} [contentDir] defaults to the project's content/ directory
 * @returns {{categories: Array}}
 */
export function buildStruct(contentDir = DEFAULT_CONTENT_DIR) {
    const home = {
        id: "acceuil",
        label: "Acceuil",
        chapters: [{ id: "acceuil", label: readTitle(path.join(contentDir, "acceuil.md")) }]
    };
    const categoryFolders = listSubdirectories(contentDir);
    const categories = [home, ...categoryFolders.map(folder => buildCategory(contentDir, folder))];
    return { categories };
}

/**
 * @param {{categories: Array}} struct
 * @param {string} [outputPath] defaults to the project's structure/struct.json
 */
export function writeStruct(struct, outputPath = DEFAULT_STRUCT_PATH) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(struct, null, 2) + "\n", "utf-8");
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
    const struct = buildStruct();
    validateInternalLinks(DEFAULT_CONTENT_DIR, struct);
    writeStruct(struct);
    console.log(`structure/struct.json généré avec ${struct.categories.length} catégories.`);
}
