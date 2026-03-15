const sharp = require('sharp');
module.exports = {
  async generateLayout(hdPath, outputPath, count = 8) {
    const canvasW = 1800; const canvasH = 1200; const cols = count <= 6 ? 3 : count <= 8 ? 4 : 4;
    const rows = Math.ceil(count / cols); const gap = 20; const margin = 40;
    const cellW = Math.floor((canvasW - margin * 2 - gap * (cols - 1)) / cols);
    const cellH = Math.floor((canvasH - margin * 2 - gap * (rows - 1)) / rows);
    const photo = await sharp(hdPath).resize(cellW, cellH, { fit: 'contain', background: '#FFFFFF' }).toBuffer();
    const composites = [];
    for (let i = 0; i < count; i += 1) {
      const x = margin + (i % cols) * (cellW + gap);
      const y = margin + Math.floor(i / cols) * (cellH + gap);
      composites.push({ input: photo, left: x, top: y });
    }
    await sharp({ create: { width: canvasW, height: canvasH, channels: 3, background: '#FFFFFF' } }).composite(composites).jpeg({ quality: 95 }).toFile(outputPath);
    return { outputPath, count };
  }
};
