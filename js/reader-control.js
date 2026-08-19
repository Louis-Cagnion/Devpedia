import { createTag } from "./tags.js";
import { t } from "./i18n.js";
import {
    SPEECH_SUPPORTED,
    hasUsableVoice,
    startReading,
    startFromVisible,
    replayParagraph,
    previousParagraph,
    nextParagraph,
    triggerPrimaryAction,
    cycleReaderRate,
    onStatusChange,
} from "./reader.js";

/**
 * @brief Builds one instance of the read-aloud control. Exactly one of two button pairs shows at
 * a time: listen/restart while idle, or pause/replay/previous/next while playing. Call once per
 * place it needs to appear; every instance shares reader.js's playback state via onStatusChange().
 *
 * @returns {HTMLElement|null} null if the browser has no Web Speech API at all
 */
export function createReaderControl() {
    if (!SPEECH_SUPPORTED) return null;

    const wrapper = createTag("div", { class: "readerControl" });
    hasUsableVoice().then(usable => {
        if (!usable) {
            wrapper.replaceChildren(
                createTag("p", { class: "readerUnavailableNotice" }, { textContent: t("readerUnavailable") })
            );
        }
    });
    const listenButton = createTag(
        "button",
        { class: "returnButton readerListenButton" },
        { textContent: t("readerListen") }
    );
    const restartButton = createTag(
        "button",
        { class: "returnButton readerRestartButton" },
        { textContent: t("readerRestart") }
    );
    const primaryButton = createTag("button", { class: "returnButton readerPrimaryButton" });
    const replayButton = createTag(
        "button",
        { class: "returnButton readerReplayButton" },
        { textContent: t("readerReplay") }
    );
    const previousButton = createTag(
        "button",
        { class: "returnButton readerPreviousButton" },
        { textContent: t("readerPreviousParagraph") }
    );
    const nextButton = createTag(
        "button",
        { class: "returnButton readerNextButton" },
        { textContent: t("readerNextParagraph") }
    );
    const rateButton = createTag(
        "button",
        { class: "returnButton readerRateButton", title: t("readerSpeed") }
    );
    listenButton.addEventListener("click", startFromVisible);
    restartButton.addEventListener("click", startReading);
    primaryButton.addEventListener("click", triggerPrimaryAction);
    replayButton.addEventListener("click", replayParagraph);
    previousButton.addEventListener("click", previousParagraph);
    nextButton.addEventListener("click", nextParagraph);
    rateButton.addEventListener("click", cycleReaderRate);
    // Deliberate order (Louis, 2026-08-16): previous, pause/resume, next, replay.
    wrapper.append(listenButton, restartButton, previousButton, primaryButton, nextButton, replayButton, rateButton);

    const applyStatus = status => {
        const inProgress = status.isPlaying || status.isPaused || status.isPausedAtCode;
        listenButton.classList.toggle("visible", !inProgress);
        restartButton.classList.toggle("visible", !inProgress);
        listenButton.disabled = restartButton.disabled = !status.hasPlan;
        primaryButton.classList.toggle("visible", inProgress);
        primaryButton.textContent = status.isPausedAtCode ? t("readerContinue")
            : status.isPlaying ? t("readerPause")
            : t("readerResume");
        replayButton.classList.toggle("visible", inProgress);
        previousButton.classList.toggle("visible", inProgress);
        nextButton.classList.toggle("visible", inProgress);
        // Always visible (idle and playing alike), unlike the pairs above: a speed choice applies to whichever comes next.
        rateButton.textContent = `⏱ ×${status.rate}`;
    };
    onStatusChange(applyStatus);

    return wrapper;
}
