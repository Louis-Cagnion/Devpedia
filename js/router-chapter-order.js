import { appState } from "./state.js";

/* Site-wide chapter order, derived from the loaded structure: a separate reason to change from
   router.js's rendering and navigation. */

/**
 * @brief Returns every chapter of the site in reading order, subjects and subject-less
 * categories both flattened to the same {categoryId, subjectId, id, label} shape.
 *
 * @returns {Array<{categoryId: string, subjectId: string|null, id: string, label: string}>}
 */
function flattenChapters() {
    const entries = [];
    // Excludes "acceuil": a synthetic entry generate-struct.js adds only so internal home links
    // validate, with no `folder` -- navigateToChapter() can't render it (cf. generateHomePage()).
    appState.categories.filter(category => category.id !== "acceuil").forEach(category => {
        (category.subjects ?? [{ id: null, chapters: category.chapters ?? [] }]).forEach(subject => {
            (subject.chapters ?? []).forEach(chapter => {
                entries.push({ categoryId: category.id, subjectId: subject.id, id: chapter.id, label: chapter.label });
            });
        });
    });
    return entries;
}

/**
 * @brief Returns the index, within the site-wide flattened chapter list, of the chapter currently
 * displayed.
 *
 * @param {Array<{categoryId: string, subjectId: string|null, id: string, label: string}>} entries
 *
 * @returns {number} -1 if the current page isn't a chapter (home, a category, a subject)
 */
function curChapterIndex(entries) {
    return entries.findIndex(entry =>
        entry.categoryId === appState.curCategory && entry.subjectId === appState.curSubject && entry.id === appState.curPageId
    );
}

/**
 * @brief Returns the chapter right after the one currently displayed, crossing subject and
 * category boundaries -- unlike router.js's currentNextChapter, which stops at the end of the
 * current subject/category. Used by read-aloud's own auto-advance once a chapter finishes on its own, and
 * by renderChapter() as the on-page "next chapter" button's fallback at the end of a section.
 *
 * @returns {{categoryId: string, subjectId: string|null, id: string, label: string}|null} null past the site's last chapter
 */
export function resolveNextChapterAcrossSite() {
    const entries = flattenChapters();
    const curIndex = curChapterIndex(entries);
    return curIndex === -1 ? null : (entries[curIndex + 1] ?? null);
}

/**
 * @brief Returns the chapter right before the one currently displayed, crossing subject and
 * category boundaries the same way resolveNextChapterAcrossSite() does. Used by renderChapter()
 * as the on-page "previous chapter" button's fallback at the start of a section.
 *
 * @returns {{categoryId: string, subjectId: string|null, id: string, label: string}|null} null before the site's first chapter
 */
export function resolvePreviousChapterAcrossSite() {
    const entries = flattenChapters();
    const curIndex = curChapterIndex(entries);
    return curIndex <= 0 ? null : entries[curIndex - 1];
}
