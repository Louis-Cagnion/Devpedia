/**
 * @brief Generates the browser-tab favicon (there was none before: no favicon.ico, no `<link
 * rel="icon">`), drawn from scratch like generate-pwa-icons.mjs (encoding shared via
 * png-encoder.mjs) rather than needing an image tool.
 *
 * Draws a filled diamond -- the UI redesign's own recurring marker (sidebar categories, chapter
 * titles, child cards) -- split diagonally between css/base.css's --accent-warm (bottom-left)
 * and --accent (top-right), on a transparent background (no --bg-deep fill: a plain colored mark
 * reads as a proper icon, not a swatch, and works on either a light or dark browser tab).
 *
 * Usage: node scripts/generate-favicon.mjs
 * Output: icons/favicon-<size>.png for each of FAVICON_SIZES.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { encodePng } from "./png-encoder.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = path.join(__dirname, "..", "icons");

const WARM_COLOR = [0xd0, 0x87, 0x70]; // --accent-warm
const COOL_COLOR = [0x88, 0xc0, 0xd0]; // --accent
const FAVICON_SIZES = [16, 32, 48];

/** @brief Renders one size as a raw RGBA pixel buffer: transparent, except a centered diamond split diagonally warm/cool. */
function renderFavicon(size) {
    const pixels = Buffer.alloc(size * size * 4); // zero-filled: fully transparent everywhere by default

    const cx = (size - 1) / 2;
    const cy = (size - 1) / 2;
    const radius = size * 0.38;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const dx = x - cx;
            const dy = y - cy;
            if (Math.abs(dx) + Math.abs(dy) > radius) continue;
            const color = dy - dx > 0 ? WARM_COLOR : COOL_COLOR;
            pixels.set([...color, 255], (y * size + x) * 4);
        }
    }
    return pixels;
}

fs.mkdirSync(ICONS_DIR, { recursive: true });
for (const size of FAVICON_SIZES) {
    const png = encodePng(size, renderFavicon(size));
    fs.writeFileSync(path.join(ICONS_DIR, `favicon-${size}.png`), png);
    console.log(`icons/favicon-${size}.png`);
}
