import { appState } from "./state.js";
import { fetchFileToTextOrJson, findSubject } from "./utils.js";

/* ---- cross-language fallback for a page missing in the active language ----
   Folder/file names (ids) are never translated, so an id valid in one language's struct-*.json
   is the same id in another's. French is guaranteed to succeed if the id is valid at all. */

/* Struct files already fetched during a fallback lookup this session, keyed by language code
   ("" for French) -- avoids re-fetching the same struct on every subsequent missing page. */
const structCache = new Map();

async function fetchStructCategories(lang) {
    if (structCache.has(lang)) return structCache.get(lang);
    const path = lang ? `./structure/struct-${lang}.json` : "./structure/struct.json";
    const { categories } = await fetchFileToTextOrJson(path, 'json');
    structCache.set(lang, categories);
    return categories;
}

/**
 * @brief Resolves categoryId/subjectId/pageId within one language's own category tree.
 *
 * @param {Array} categories one language's category tree (structure/struct-*.json's `categories`)
 *
 * @returns {{category: Object, subject: Object|null, chapter: Object|null}|null} null if it
 *   doesn't resolve within `categories`
 */
function resolveInCategories(categories, categoryId, subjectId, pageId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return null;
    if (pageId === categoryId) return { category, subject: null, chapter: null };
    if (subjectId) {
        const subject = findSubject(category, subjectId);
        if (!subject) return null;
        if (pageId === subjectId) return { category, subject, chapter: null };
        const chapter = subject.chapters?.find(c => c.id === pageId);
        return chapter ? { category, subject, chapter } : null;
    }
    const chapter = category.chapters?.find(c => c.id === pageId);
    return chapter ? { category, subject: null, chapter } : null;
}

/**
 * @brief Resolves categoryId/subjectId/pageId against the active language first, then English,
 * then French.
 *
 * @returns {Promise<{lang: string, category: Object, subject: Object|null, chapter: Object|null}|null>}
 *   null only if the id doesn't exist in any language (a stale/broken link)
 */
export async function resolveAcrossLanguages(categoryId, subjectId, pageId) {
    const direct = resolveInCategories(appState.categories, categoryId, subjectId, pageId);
    if (direct) return { lang: appState.lang, ...direct };

    // EN and FR (content/, lang "") are the deliberate reference languages, independent of
    // structure/languages.json: not meant to grow as translated languages are added.
    for (const lang of ["en", ""].filter(l => l !== appState.lang)) {
        const categories = await fetchStructCategories(lang);
        const found = resolveInCategories(categories, categoryId, subjectId, pageId);
        if (found) return { lang, ...found };
    }
    return null;
}
