/* Pure text-normalization helpers (diacritics, slugs) shared between the browser (js/parser.js,
   js/search.js) and Node build scripts (scripts/generate-struct.js). No Node or DOM API used
   here, importable from either side. */

/**
 * @brief Removes accents from `text` (NFD-decomposes each accented letter, then strips the
 * decomposed accent marks), without changing case.
 *
 * @param {string} text
 *
 * @returns {string}
 */
export function stripDiacritics(text) {
    return text.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/**
 * @brief Builds a kebab-case slug from `text`: lowercased, accents stripped, any run of
 * non-alphanumeric characters collapsed to a single `-`, no leading/trailing `-`.
 *
 * @param {string} text
 *
 * @returns {string}
 */
export function slugify(text) {
    return stripDiacritics(text)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
