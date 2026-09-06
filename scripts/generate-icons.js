import fs from 'fs';
import zlib from 'zlib';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

// Minimal PNG generator using zlib
function createPNG(width, height, pixelFn) {
  // RGBA buffer with filter byte per scanline
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA (6)
  ihdrData[10] = 0; // Compression: Deflate
  ihdrData[11] = 0; // Filter: Standard
  ihdrData[12] = 0; // Interlace: None
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT Chunk
  const idatChunk = createChunk('IDAT', compressed);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(12 + length);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc >>> 0, 8 + length);
  return chunk;
}

// CRC32 implementation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff);
}

// Color drawing helper for EasyPresenter Icon
function renderEasyPresenterPixel(x, y, width, height, isMaskable = false) {
  const nx = (x / width) * 512;
  const ny = (y / height) * 512;

  // Background gradient: dark navy/indigo to deep dark
  const bgT = Math.min(1, Math.max(0, (nx + ny) / 1024));
  let r = Math.round(15 * (1 - bgT) + 9 * bgT);
  let g = Math.round(23 * (1 - bgT) + 13 * bgT);
  let b = Math.round(42 * (1 - bgT) + 24 * bgT);
  let a = 255;

  // If not maskable, round outer corners (radius 100)
  if (!isMaskable) {
    const radius = 96;
    let distCorner = 0;
    if (nx < radius && ny < radius) distCorner = Math.hypot(nx - radius, ny - radius);
    else if (nx > 512 - radius && ny < radius) distCorner = Math.hypot(nx - (512 - radius), ny - radius);
    else if (nx < radius && ny > 512 - radius) distCorner = Math.hypot(nx - radius, ny - (512 - radius));
    else if (nx > 512 - radius && ny > 512 - radius) distCorner = Math.hypot(nx - (512 - radius), ny - (512 - radius));

    if (distCorner > radius) {
      return [0, 0, 0, 0];
    }
  }

  // Draw Screen Bezel: x in [84, 428], y in [100, 330]
  if (nx >= 84 && nx <= 428 && ny >= 100 && ny <= 330) {
    // Bezel border
    if (nx <= 90 || nx >= 422 || ny <= 106 || ny >= 324) {
      return [56, 189, 248, 255]; // Sky blue border
    }

    // Top Bar (y: 106 to 142)
    if (ny <= 142) {
      // Top bar background
      r = 30; g = 41; b = 59;
      // Red dot (110, 124, r: 6)
      if (Math.hypot(nx - 110, ny - 124) <= 6) return [239, 68, 68, 255];
      // Yellow dot (128, 124, r: 6)
      if (Math.hypot(nx - 128, ny - 124) <= 6) return [245, 158, 11, 255];
      // Green dot (146, 124, r: 6)
      if (Math.hypot(nx - 146, ny - 124) <= 6) return [16, 185, 129, 255];
      // LIVE badge (360 to 410, 114 to 134)
      if (nx >= 360 && nx <= 410 && ny >= 114 && ny <= 134) {
        return [239, 68, 68, 255];
      }
      return [r, g, b, 255];
    }

    // Screen Inner Canvas
    const screenT = (ny - 142) / (324 - 142);
    r = Math.round(15 + 10 * screenT);
    g = Math.round(20 + 8 * screenT);
    b = Math.round(35 + 20 * screenT);

    // Play triangle symbol centered at (256, 225)
    // Points: (220, 175), (305, 225), (220, 275)
    const px1 = 220, py1 = 175;
    const px2 = 305, py2 = 225;
    const px3 = 220, py3 = 275;

    // Check point in triangle
    const d1 = (nx - px2) * (py1 - py2) - (px1 - px2) * (ny - py2);
    const d2 = (nx - px3) * (py2 - py3) - (px2 - px3) * (ny - py3);
    const d3 = (nx - px1) * (py3 - py1) - (px3 - px1) * (ny - py1);
    const has_neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const has_pos = (d1 > 0) || (d2 > 0) || (d3 > 0);

    if (!(has_neg && has_pos)) {
      // Gold gradient play button
      const pT = (nx - 220) / 85;
      return [
        Math.round(251 * (1 - pT) + 245 * pT),
        Math.round(191 * (1 - pT) + 158 * pT),
        Math.round(36 * (1 - pT) + 11 * pT),
        255
      ];
    }

    // Subtitle preview lines: (130 to 250, 290 to 300) and (265 to 375, 290 to 300)
    if (ny >= 290 && ny <= 300) {
      if (nx >= 130 && nx <= 250) return [226, 232, 240, 220];
      if (nx >= 265 && nx <= 375) return [56, 189, 248, 220];
    }

    return [r, g, b, 255];
  }

  // Stand Neck: x in [240, 272], y in [330, 395]
  if (nx >= 240 && nx <= 272 && ny >= 330 && ny <= 395) {
    return [30, 41, 59, 255];
  }

  // Stand Base: x in [180, 332], y in [395, 415]
  if (nx >= 180 && nx <= 332 && ny >= 395 && ny <= 415) {
    const baseT = (nx - 180) / 152;
    return [
      Math.round(56 * (1 - baseT) + 139 * baseT),
      Math.round(189 * (1 - baseT) + 92 * baseT),
      Math.round(248 * (1 - baseT) + 246 * baseT),
      255
    ];
  }

  // Cyan accent bar under title at bottom (nx in [120, 392], ny in [460, 468])
  if (nx >= 120 && nx <= 392 && ny >= 460 && ny <= 468) {
    return [56, 189, 248, 255];
  }

  return [r, g, b, a];
}

console.log('Generating PWA icons...');
const png192 = createPNG(192, 192, (x, y, w, h) => renderEasyPresenterPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);

const png512 = createPNG(512, 512, (x, y, w, h) => renderEasyPresenterPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);

const pngMaskable512 = createPNG(512, 512, (x, y, w, h) => renderEasyPresenterPixel(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'icon-maskable-512.png'), pngMaskable512);

console.log('Icons generated successfully in /public!');
