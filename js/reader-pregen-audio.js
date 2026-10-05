import { appState } from "./state.js";
import { getStoredLanguage } from "./lang.js";
import { findCategory, findSubject } from "./utils.js";
import { logEvent } from "./reader-debug.js";

/**
 * @brief Returns the chapter's path under audio/<lang>/, mirroring content/<category
 * folder>/<subject folder>/<chapterId> -- a chapter id alone isn't unique site-wide (e.g.
 * "variables" exists under both `c` and `php`), so the audio tree needs the same category/subject
 * namespacing as content/ itself to avoid two different chapters silently sharing one file
 * (Louis, 23/08/2026).
 *
 * @returns {string}
 */
function chapterAudioPath() {
    const category = findCategory({ id: appState.curCategory });
    const subject = appState.curSubject ? findSubject(category, appState.curSubject) : null;
    const folderParts = [category?.folder, subject?.folder].filter(Boolean);
    return [...folderParts, appState.curPageId].join("/");
}

/**
 * @brief Fetches audio/<lang>/<chapterAudioPath()>.json and .mp3 together and, only if the JSON's
 * entries match `plan`'s own "speak"/"pause" sequence 1:1 (same count, same kind in the same order
 * -- the one sane proxy for "still the same content" without hashing the source), merges each
 * entry's startMs/durationMs (or a pause's afterMs) onto the matching `plan` entry and returns the
 * mp3, loaded whole as a Blob rather than left to stream from the network -- iOS throttles
 * background network access hard enough that a streaming src can stall and re-buffer mid-word once
 * the phone locks (confirmed on a real iPhone, 22/08/2026); a blob: URL made from it needs no
 * network at all once loaded, so nothing the OS does to the connection can interrupt it.
 *
 * @param {Array} plan the reading plan to merge timings onto
 * @param {() => boolean} isStale whether the page moved on while the fetches were in flight
 *   (`plan` may already point somewhere else by the time they resolve)
 *
 * @returns {Promise<Blob|null>} null on a failed fetch, a stale page or a plan/audio mismatch,
 *   leaving `plan` untouched
 */
export async function fetchPregenAudio(plan, isStale) {
    const langCode = getStoredLanguage() || "fr";
    const chapterPath = chapterAudioPath();
    let timing, blob;
    try {
        const [timingResponse, audioResponse] = await Promise.all([
            fetch(`./audio/${langCode}/${chapterPath}.json`),
            fetch(`./audio/${langCode}/${chapterPath}.mp3`),
        ]);
        if (!timingResponse.ok || !audioResponse.ok) return null;
        [timing, blob] = await Promise.all([timingResponse.json(), audioResponse.blob()]);
    } catch {
        return null;
    }
    if (isStale()) return null;
    if (timing.length !== plan.length) {
        logEvent("pregen:mismatch", `length timing=${timing.length} plan=${plan.length}`);
        return null;
    }
    const mismatchIndex = timing.findIndex((t, i) => t.kind !== plan[i].kind);
    if (mismatchIndex !== -1) {
        logEvent("pregen:mismatch", `kind at index=${mismatchIndex} timing=${timing[mismatchIndex].kind} plan=${plan[mismatchIndex].kind}`);
        return null;
    }
    timing.forEach((t, i) => Object.assign(plan[i], t));
    return blob;
}
