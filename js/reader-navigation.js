/* Viewport and paragraph-position helpers for js/reader.js's playback engine: where on screen an
   element sits, and which plan entries are neighbouring paragraphs. Pure functions over the plan
   passed in, a separate reason to change from the playback state machine itself. */

/** @brief Returns the sticky navbar's own height in pixels. */
function getNavbarHeight() {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--navbar-height")) || 0;
}

/** @brief Returns the mobile floating reader bar's height in pixels, 0 if not currently a fixed overlay. */
function getFloatingBarHeight() {
    const bar = document.querySelector(".readerFloatingBar");
    if (!bar || getComputedStyle(bar).position !== "fixed") return 0;
    return bar.getBoundingClientRect().height;
}

/**
 * @brief Reports whether `element` is entirely on screen: both its top and bottom edge, below
 * the sticky navbar and above the floating reader bar.
 *
 * @param {HTMLElement} element
 *
 * @returns {boolean}
 */
export function isElementFullyVisible(element) {
    const { top, bottom } = element.getBoundingClientRect();
    return top >= getNavbarHeight() && bottom <= window.innerHeight - getFloatingBarHeight();
}

/**
 * @brief Returns the index of the first "speak" entry whose paragraph hasn't fully scrolled past
 * the top of the viewport yet, or 0 if nothing qualifies.
 *
 * @param {Array} plan the reading plan
 *
 * @returns {number}
 */
export function findVisibleEntryIndex(plan) {
    const navbarHeight = getNavbarHeight();
    for (let i = 0; i < plan.length; i++) {
        const entry = plan[i];
        if (entry.kind === "speak" && entry.group.getBoundingClientRect().bottom > navbarHeight) return i;
    }
    return 0;
}

/**
 * @brief Returns the plan index of the adjacent paragraph's first "speak" entry.
 *
 * @param {Array} plan the reading plan
 * @param {number} fromIndex a plan index to search from, typically the current `planIndex`
 * @param {1|-1} direction 1 for the next paragraph, -1 for the previous one
 *
 * @returns {number|null} null if there isn't one in that direction
 */
export function adjacentParagraphIndex(plan, fromIndex, direction) {
    const currentEntry = plan[fromIndex];
    if (!currentEntry) return null;
    const currentGroup = currentEntry.kind === "speak" ? currentEntry.group : currentEntry.element;
    let i = fromIndex;
    /* Steps past whatever's left of the current paragraph, or (if paused at a code block) that
       block itself. */
    while (plan[i] && (plan[i].kind === "speak" ? plan[i].group : plan[i].element) === currentGroup) i += direction;
    // A "pause" entry (a code block) in between isn't a paragraph to land on -- skip it too.
    while (plan[i] && plan[i].kind !== "speak") i += direction;
    if (!plan[i]) return null;
    if (direction > 0) return i;
    /* Walking backward, `i` is the *last* entry of the previous paragraph -- keep going back to
       find where that paragraph actually starts. */
    const targetGroup = plan[i].group;
    while (plan[i - 1] && plan[i - 1].kind === "speak" && plan[i - 1].group === targetGroup) i--;
    return i;
}
