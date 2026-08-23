#!/usr/bin/env node
/**
 * @brief Scans a content directory and (re)generates its struct.json to match what's on disk.
 * Run with: node scripts/generate-struct.js (also importable, see buildStruct/writeStruct, to
 * build a struct-<lang>.json for a translated content-<lang>/ directory the same way this file's
 * own CLI usage builds structure/struct.json for content/).
 *
 * Conventions this relies on (matching how content/ is authored):
 * - <content>/acceuil.md is the home page, always mapped to the fixed "acceuil" category.
 * - a category is a top-level folder under <content>. It has a description.md.
 * - if a category folder contains subfolders, each subfolder is a "subject" (e.g. C, C++, PHP)
 *   and its own chapters are the .md files directly inside it.
 * - if a category folder has no subfolders, its .md files (except description.md) are its
 *   chapters directly (e.g. Bash, Git).
 * - a subject's own description page is the .md file inside it whose first line (a `# Title`
 *   heading) matches the subject folder name (case-insensitive): e.g. cpp.md titled "C++"
 *   inside the "C++" folder. The rest of the .md files in that folder are its chapters.
 * - a file's title is its first line, a `# Title` markdown heading, not frontmatter.
 * - an optional `---`-fenced frontmatter block may precede that heading, holding build-time
 *   metadata only (currently just `order`, an integer used to sort chapters, and, on a
 *   subject's own main file, to sort that subject among its siblings the same way).
 *
 * Hard cap, not just a convention: nesting stops at exactly 2 levels (category > subject >
 * chapters). A subfolder inside a subject's folder is never descended into — buildSubject() only
 * lists the subject folder's own .md files as chapters, so a 3rd level is silently ignored rather
 * than erroring. The URL scheme (`?c=&s=&p=`, see nav-url.js) and the site's rendering
 * (router.js/sidebar.js reading `category.subjects ?? category.chapters`) share the same
 * assumption. If a subject ever needs its own internal grouping (e.g. "Langages" already has 12
 * subjects and could plausibly want one), that's a deliberate schema change across all of these
 * places, not a one-line fix here.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolveLegacyCategory } from "../js/legacy-category-redirects.js";
import { splitFrontmatter } from "../js/frontmatter.js";
import { slugify } from "../js/text.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CONTENT_DIR = path.join(__dirname, "..", "content");
const DEFAULT_STRUCT_PATH = path.join(__dirname, "..", "structure", "struct.json");

/**
 * @brief Strips a file's optional frontmatter and returns its markdown body.
 *
 * @param {string} filePath
 *
 * @returns {string}
 */
function readBody(filePath) {
    return splitFrontmatter(fs.readFileSync(filePath, "utf-8")).body;
}

/**
 * @brief Reads a file's optional frontmatter's `key: value` pairs.
 *
 * @param {string} filePath
 *
 * @returns {Object<string, string>}
 */
function readFrontmatter(filePath) {
    const raw = fs.readFileSync(filePath, "utf-8");
    const fields = {};
    const { frontmatter } = splitFrontmatter(raw);
    if (frontmatter === null) return fields;
    const yaml = frontmatter.trim();
    yaml.split("\n").forEach(line => {
        const sepIndex = line.indexOf(": ");
        if (sepIndex === -1) return;
        fields[line.slice(0, sepIndex).trim()] = line.slice(sepIndex + 2).trim();
    });
    return fields;
}

/**
 * @brief Reads a file's title: its first line, a `# Title` heading.
 *
 * @param {string} filePath
 *
 * @returns {string}
 */
function readTitle(filePath) {
    const firstLine = readBody(filePath).split("\n")[0];
    const match = firstLine.match(/^#\s+(.*)/);
    return match ? match[1].trim() : firstLine.trim();
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
 * @brief Sorts items most fundamental first using their `order` field (a small integer, unique
 * among siblings). Items without an `order` (`null`) are pushed to the end, in their existing
 * (alphabetical) order. Shared by chapters and subjects: both are ordered the same way, from
 * the same kind of frontmatter field.
 *
 * @param {Array<{order: number|null}>} items mutated in place, like Array.prototype.sort
 */
function sortByOrder(items) {
    items.sort((a, b) => {
        if (a.order === null && b.order === null) return 0;
        if (a.order === null) return 1;
        if (b.order === null) return -1;
        return a.order - b.order;
    });
}

/**
 * @brief Builds the ordered chapter list for a set of markdown files.
 *
 * @param {string} dir
 * @param {string[]} fileNames
 *
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
    sortByOrder(chapters);
    return chapters.map(({id, label}) => ({id, label}));
}

/**
 * @brief Builds one subject's entry (its own main file plus its chapters).
 *
 * @param {string} categoryDir
 * @param {string} subjectFolder
 *
 * @returns {{id: string, label: string, folder: string, order: number|null, chapters: Array}}
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
    const order = mainFile ? readFrontmatter(path.join(subjectDir, mainFile)).order : undefined;
    return {
        id: mainFile ? mainFile.slice(0, -3) : slugify(subjectFolder),
        label: subjectFolder,
        folder: subjectFolder,
        order: order === undefined ? null : Number(order),
        chapters: buildChapterList(subjectDir, chapterFiles)
    };
}

/**
 * @brief Builds one category's entry, with either `subjects` or `chapters` depending on
 * whether its folder has subfolders.
 *
 * @param {string} contentDir
 * @param {string} categoryFolder
 *
 * @returns {{id: string, label: string, folder: string, subjects?: Array, chapters?: Array}}
 */
function buildCategory(contentDir, categoryFolder) {
    const categoryDir = path.join(contentDir, categoryFolder);
    const subjectFolders = listSubdirectories(categoryDir);
    const descriptionPath = path.join(categoryDir, "description.md");
    const order = fs.existsSync(descriptionPath) ? readFrontmatter(descriptionPath).order : undefined;
    const category = {
        id: slugify(categoryFolder),
        label: categoryFolder,
        folder: categoryFolder,
        order: order === undefined ? null : Number(order)
    };
    if (subjectFolders.length > 0) {
        const subjects = subjectFolders.map(subjectFolder => buildSubject(categoryDir, subjectFolder));
        sortByOrder(subjects);
        category.subjects = subjects.map(({id, label, folder, chapters}) => ({id, label, folder, chapters}));
    } else {
        const chapterFiles = listMarkdownFiles(categoryDir).filter(fileName => fileName !== "description.md");
        category.chapters = buildChapterList(categoryDir, chapterFiles);
    }
    return category;
}

/* Matches internal links as written in .md files, at any of the 3 levels a link can target: a
   chapter, a subject's own intro page (`p` repeating `s`), or a category's own intro page (`p`
   repeating `c`, or `p` omitted entirely). See validateInternalLinks() below for each case. */
const INTERNAL_LINK_PATTERN = /\/\?c=([a-z0-9-]+)(?:&s=([a-z0-9-]+))?(?:&p=([a-z0-9-]+))?/g;

/**
 * @brief Indexes a struct's valid chapter/subject ids per category id, to validate internal
 * links against.
 *
 * @param {{categories: Array}} struct
 *
 * @returns {Map<string, {chapters: Set<string>, subjects: Map<string, Set<string>>}>}
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
 * @brief Walks every .md file under contentDir and validates each internal "?c=...&s=...&p=..."
 * link against the freshly built struct. Without this, renaming a category/subject folder
 * (which changes its slugified id) silently breaks every link pointing to it: no error anywhere
 * on the site, the broken chapter just never opens.
 *
 * @param {string} contentDir
 * @param {{categories: Array}} struct
 *
 * @throws {Error} listing every broken link found (file + link), if any
 */
export function validateInternalLinks(contentDir, struct) {
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
            for (const [link, rawCategoryId, rawSubjectId, rawChapterId] of text.matchAll(INTERNAL_LINK_PATTERN)) {
                /* A rawCategoryId folded away by a past site reorganization (see
                   legacy-category-redirects.js) resolves to its new location first, so an old
                   unrewritten link validates against where its target actually lives now. */
                const { categoryId, subjectId, pageId: chapterId } = resolveLegacyCategory({
                    categoryId: rawCategoryId,
                    subjectId: rawSubjectId ?? null,
                    pageId: rawChapterId ?? rawCategoryId
                });
                const category = index.get(categoryId);
                if (!category) {
                    broken.push(`${entryPath} -> ${link} (catégorie "${categoryId}" introuvable)`);
                } else if (rawChapterId === undefined || (!subjectId && chapterId === categoryId)) {
                    /* No `p` at all, or p=<categoryId> (same value as c=): both link to the
                       category's own intro page (its description.md), never a chapter to check. */
                } else if (subjectId) {
                    const subjectChapters = category.subjects.get(subjectId);
                    if (!subjectChapters) {
                        broken.push(`${entryPath} -> ${link} (sujet "${subjectId}" introuvable dans "${categoryId}")`);
                    } else if (chapterId !== subjectId && !subjectChapters.has(chapterId)) {
                        /* p=<subjectId> (same value as s=) links to the subject's own intro page
                           (its "main file", excluded from `chapters`, see buildSubject), not a chapter. */
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
 * @brief Builds the full struct (every category) for a content directory.
 *
 * @param {string} [contentDir] defaults to the project's content/ directory
 *
 * @returns {{categories: Array}}
 */
export function buildStruct(contentDir = DEFAULT_CONTENT_DIR) {
    const home = {
        id: "acceuil",
        label: "Acceuil",
        chapters: [{ id: "acceuil", label: readTitle(path.join(contentDir, "acceuil.md")) }]
    };
    const categoryFolders = listSubdirectories(contentDir);
    const categories = categoryFolders.map(folder => buildCategory(contentDir, folder));
    sortByOrder(categories);
    const orderedCategories = categories.map(({id, label, folder, subjects, chapters}) =>
        subjects ? {id, label, folder, subjects} : {id, label, folder, chapters});
    return { categories: [home, ...orderedCategories] };
}

/**
 * @brief Writes a struct to disk as JSON.
 *
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
