import { appState } from "./state.js";
import { t, tEntityLabel } from "./i18n.js";

/* Site-wide chapter order, derived from the loaded structure: a separate reason to change from
   router.js's rendering and navigation. */

/**
 * @brief Builds the label of a category's or subject's own page, as shown on a prev/next button.
 *
 * @param {string} name translated category or subject name
 *
 * @returns {string}
 */
function introLabel(name) {
    return `${t("introduction")} : ${name}`;
}

/**
 * @brief Returns every page of the site in reading order: for each category its own page, then
 * for each subject its own page followed by its chapters (the same "Introduction" entries the
 * sidebar tree shows). `kind` tells how to open an entry (cf. router.js's navigateToEntry).
 *
 * @returns {Array<{kind: "category"|"subject"|"chapter", categoryId: string, subjectId: string|null, id: string, label: string}>}
 */
function flattenChapters() {
    const entries = [];
    // Excludes "acceuil": a synthetic entry generate-struct.js adds only so internal home links
    // validate, with no `folder` -- navigateToChapter() can't render it (cf. generateHomePage()).
    appState.categories.filter(category => category.id !== "acceuil").forEach(category => {
        const categoryName = tEntityLabel("categoryLabels", category.id, category.label);
        entries.push({ kind: "category", categoryId: category.id, subjectId: null, id: category.id, label: introLabel(categoryName) });
        (category.subjects ?? [{ id: null, chapters: category.chapters ?? [] }]).forEach(subject => {
            if (subject.id !== null) {
                const subjectName = tEntityLabel("subjectLabels", subject.id, subject.label);
                entries.push({ kind: "subject", categoryId: category.id, subjectId: subject.id, id: subject.id, label: introLabel(subjectName) });
            }
            (subject.chapters ?? []).forEach(chapter => {
                entries.push({ kind: "chapter", categoryId: category.id, subjectId: subject.id, id: chapter.id, label: chapter.label });
            });
        });
    });
    return entries;
}

/**
 * @brief Returns the index, within the site-wide flattened list, of the page currently displayed.
 *
 * @param {Array<{categoryId: string, subjectId: string|null, id: string}>} entries
 *
 * @returns {number} -1 if the current page isn't in the list (home, or a page shown from another language)
 */
function curChapterIndex(entries) {
    return entries.findIndex(entry =>
        entry.categoryId === appState.curCategory && entry.subjectId === appState.curSubject && entry.id === appState.curPageId
    );
}

/**
 * @brief Returns the page right after the one currently displayed, crossing subject and
 * category boundaries and stopping on each category's or subject's own page on the way (a
 * subject's introduction comes before its first chapter). Used by read-aloud's own auto-advance
 * once a page finishes on its own, by renderChapter() as the on-page "next" button's fallback at
 * the end of a section, and by the category and subject pages for both of their buttons.
 *
 * @returns {{kind: string, categoryId: string, subjectId: string|null, id: string, label: string}|null} null past the site's last page
 */
export function resolveNextChapterAcrossSite() {
    const entries = flattenChapters();
    const curIndex = curChapterIndex(entries);
    return curIndex === -1 ? null : (entries[curIndex + 1] ?? null);
}

/**
 * @brief Returns the page right before the one currently displayed, crossing subject and
 * category boundaries the same way resolveNextChapterAcrossSite() does. Used the same way:
 * at the start of a section the previous page is that section's own introduction.
 *
 * @returns {{kind: string, categoryId: string, subjectId: string|null, id: string, label: string}|null} null before the site's first page
 */
export function resolvePreviousChapterAcrossSite() {
    const entries = flattenChapters();
    const curIndex = curChapterIndex(entries);
    return curIndex <= 0 ? null : entries[curIndex - 1];
}
