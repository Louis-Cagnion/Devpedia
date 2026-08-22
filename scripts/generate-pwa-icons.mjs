/**
 * @brief Generates the app icons needed for "Add to Home Screen" (manifest.json + iOS
 * apple-touch-icon), one PNG per required size, encoded from scratch (zlib is Node's own
 * built-in, no image library needed for a single-glyph icon this simple).
 *
 * Draws a blocky "D" (site's accent color, css/base.css's --accent) on the site's own dark
 * background (--bg), so the installed icon reads as the same app as the site itself.
 *
 * Usage: node scripts/generate-pwa-icons.mjs
 * Output: icons/icon-<size>.png for each of ICON_SIZES, committed like audio/'s output.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = path.join(__dirname, "..", "icons");

const BG_COLOR = [0x2e, 0x34, 0x40];
const ACCENT_COLOR = [0x88, 0xc0, 0xd0];
const ICON_SIZES = [180, 192, 512]; // 180: apple-touch-icon; 192/512: manifest.json

// 7x9 blocky "D", 1 = accent pixel, read top to bottom.
const GLYPH_D = [
    "1111000",
    "1100110",
    "1100011",
    "1100011",
    "1100011",
    "1100011",
    "1100011",
    "1100110",
    "1111000",
];

function crc32(buf) {
    let crc = ~0;
    for (const byte of buf) {
        crc ^= byte;
        for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
    return ~crc >>> 0;
}

function pngChunk(type, data) {
    const typeBuf = Buffer.from(type, "ascii");
    const lengthBuf = Buffer.alloc(4);
    lengthBuf.writeUInt32BE(data.length);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
    return Buffer.concat([lengthBuf, typeBuf, data, crcBuf]);
}

/** @brief Renders one size as a raw RGBA pixel buffer: background fill + the centered, scaled glyph. */
function renderIcon(size) {
    const pixels = Buffer.alloc(size * size * 4);
    for (let i = 0; i < size * size; i++) pixels.set([...BG_COLOR, 255], i * 4);

    const glyphW = GLYPH_D[0].length;
    const glyphH = GLYPH_D.length;
    const scale = Math.floor((size * 0.6) / glyphW);
    const drawW = glyphW * scale;
    const drawH = glyphH * scale;
    const offsetX = Math.floor((size - drawW) / 2);
    const offsetY = Math.floor((size - drawH) / 2);

    for (let gy = 0; gy < glyphH; gy++) {
        for (let gx = 0; gx < glyphW; gx++) {
            if (GLYPH_D[gy][gx] !== "1") continue;
            for (let dy = 0; dy < scale; dy++) {
                for (let dx = 0; dx < scale; dx++) {
                    const x = offsetX + gx * scale + dx;
                    const y = offsetY + gy * scale + dy;
                    pixels.set([...ACCENT_COLOR, 255], (y * size + x) * 4);
                }
            }
        }
    }
    return pixels;
}

function encodePng(size, pixels) {
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(size, 0);
    ihdr.writeUInt32BE(size, 4);
    ihdr.writeUInt8(8, 8); // bit depth
    ihdr.writeUInt8(6, 9); // color type: RGBA

    const raw = Buffer.alloc(size * (size * 4 + 1));
    for (let y = 0; y < size; y++) {
        raw[y * (size * 4 + 1)] = 0; // filter: none
        pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
    }

    return Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        pngChunk("IHDR", ihdr),
        pngChunk("IDAT", zlib.deflateSync(raw)),
        pngChunk("IEND", Buffer.alloc(0)),
    ]);
}

fs.mkdirSync(ICONS_DIR, { recursive: true });
for (const size of ICON_SIZES) {
    const png = encodePng(size, renderIcon(size));
    fs.writeFileSync(path.join(ICONS_DIR, `icon-${size}.png`), png);
    console.log(`icons/icon-${size}.png`);
}
