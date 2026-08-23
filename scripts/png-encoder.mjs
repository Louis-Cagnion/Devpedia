/**
 * @brief Minimal from-scratch PNG encoder (zlib is Node's own built-in, no image library
 * needed for the flat-color icons this project draws). Shared by generate-pwa-icons.mjs and
 * generate-favicon.mjs so the encoding logic exists in exactly one place.
 */
import zlib from "node:zlib";

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

/**
 * @brief Encodes a square RGBA pixel buffer as a PNG file.
 *
 * @param {number} size width/height in pixels
 * @param {Buffer} pixels size*size*4 bytes, RGBA per pixel, row-major
 *
 * @returns {Buffer} a complete .png file
 */
export function encodePng(size, pixels) {
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
