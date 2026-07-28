#!/usr/bin/env node
/**
 * Scans content/ and (re)generates structure/struct.json to match what's on disk.
 *
 * Run with: node scripts/generate-struct.js
 *
 * Conventions this relies on (matching how content/ is authored):
 * - content/acceuil.md is the home page, always mapped to the fixed "acceuil" category.
 * - a category is a top-level folder under content/. It has a description.md.
 * - if a category folder contains subfolders, each subfolder is a "subject" (e.g. C, C++, PHP)
 *   and its own chapters are the .md files directly inside it.
 * - if a category folder has no subfolders, its .md files (except description.md) are its
 *   chapters directly (e.g. Bash, Git).
 * - a subject's own description page is the .md file inside it whose frontmatter `title`
 *   matches the subject folder name (case-insensitive) — e.g. cpp.md titled "C++" inside
 *   the "C++" folder. The rest of the .md files in that folder are its chapters.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, "..", "content");
const STRUCT_PATH = path.join(__dirname, "..", "structure", "struct.json");

/**
 * @param {string} filePath
 * @returns {string} the value of the first frontmatter line (`title: X` → "X")
 */
function readTitle(filePath) {
    const raw = fs.readFileSync(filePath, "utf-8");
    const yaml = raw.split("---")[1].trim();
    const firstLine = yaml.split("\n")[0];
    const sepIndex = firstLine.indexOf(": ");
    return (sepIndex === -1 ? firstLine : firstLine.slice(sepIndex + 2)).trim();
}

/**
 * @param {string} name
 * @returns {string} a kebab-case id
 */
function slugify(name) {
    return name
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
 * @param {string} dir
 * @param {string[]} fileNames
 * @returns {Array<{id: string, label: string}>}
 */
function buildChapterList(dir, fileNames) {
    return fileNames.map(fileName => ({
        id: fileName.slice(0, -3),
        label: readTitle(path.join(dir, fileName))
    }));
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
        chapters: buildChapterList(subjectDir, chapterFiles)
    };
}

/**
 * @param {string} categoryFolder
 */
function buildCategory(categoryFolder) {
    const categoryDir = path.join(CONTENT_DIR, categoryFolder);
    const subjectFolders = listSubdirectories(categoryDir);
    const category = {
        id: slugify(categoryFolder),
        label: categoryFolder
    };
    if (subjectFolders.length > 0) {
        category.subjects = subjectFolders.map(subjectFolder => buildSubject(categoryDir, subjectFolder));
    } else {
        const chapterFiles = listMarkdownFiles(categoryDir).filter(fileName => fileName !== "description.md");
        category.chapters = buildChapterList(categoryDir, chapterFiles);
    }
    return category;
}

function buildStruct() {
    const home = {
        id: "acceuil",
        label: "Acceuil",
        chapters: [{ id: "acceuil", label: readTitle(path.join(CONTENT_DIR, "acceuil.md")) }]
    };
    const categoryFolders = listSubdirectories(CONTENT_DIR);
    const categories = [home, ...categoryFolders.map(buildCategory)];
    return { categories };
}

const struct = buildStruct();
fs.writeFileSync(STRUCT_PATH, JSON.stringify(struct, null, 2) + "\n", "utf-8");
console.log(`structure/struct.json généré avec ${struct.categories.length} catégories.`);
