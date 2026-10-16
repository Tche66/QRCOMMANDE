import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { createWriteStream, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';

export interface RoomQR {
  roomNumber: string;
  qrToken: string;
}

export interface QRPdfOptions {
  slug: string;
  estName: string;
  domain: string;
  outputPath: string;
}

const PAGE_WIDTH = 595.28;  // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const COLS = 2;
const ROWS = 2;
const ITEMS_PER_PAGE = COLS * ROWS;

const CELL_W = (PAGE_WIDTH - MARGIN * 2) / COLS;
const CELL_H = (PAGE_HEIGHT - MARGIN * 2) / ROWS;
const QR_SIZE = 180;

export async function generateQrPdf(
  rooms: RoomQR[],
  options: QRPdfOptions,
): Promise<string> {
  const { slug, estName, domain, outputPath } = options;

  mkdirSync(dirname(outputPath), { recursive: true });

  const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
  const stream = createWriteStream(outputPath);
  doc.pipe(stream);

  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i];
    const pageIdx = i % ITEMS_PER_PAGE;

    if (i > 0 && pageIdx === 0) {
      doc.addPage();
    }

    const col = pageIdx % COLS;
    const row = Math.floor(pageIdx / COLS);
    const x = MARGIN + col * CELL_W;
    const y = MARGIN + row * CELL_H;

    const centerX = x + CELL_W / 2;

    const url = `https://${domain}/${slug}/r/${room.qrToken}`;
    const qrBuffer = await QRCode.toBuffer(url, {
      type: 'png',
      width: QR_SIZE,
      margin: 1,
      errorCorrectionLevel: 'M',
    });

    doc.fontSize(10).fillColor('#666666');
    doc.text(estName, x, y + 10, { width: CELL_W, align: 'center' });

    doc.image(qrBuffer, centerX - QR_SIZE / 2, y + 30, {
      width: QR_SIZE,
      height: QR_SIZE,
    });

    doc.fontSize(36).fillColor('#000000');
    doc.text(room.roomNumber, x, y + 30 + QR_SIZE + 10, {
      width: CELL_W,
      align: 'center',
    });

    doc.fontSize(14).fillColor('#333333');
    doc.text('Scannez pour commander', x, y + 30 + QR_SIZE + 55, {
      width: CELL_W,
      align: 'center',
    });

    doc.fontSize(7).fillColor('#999999');
    doc.text(url, x, y + 30 + QR_SIZE + 80, {
      width: CELL_W,
      align: 'center',
    });
  }

  doc.end();

  return new Promise((res, rej) => {
    stream.on('finish', () => res(outputPath));
    stream.on('error', rej);
  });
}

// Standalone usage: npx tsx scripts/generate-qr-pdf.ts --slug hotel-test --rooms-json rooms.json
if (process.argv[1]?.includes('generate-qr-pdf')) {
  const args = process.argv.slice(2);
  const getArg = (name: string): string | undefined => {
    const idx = args.indexOf(`--${name}`);
    return idx >= 0 ? args[idx + 1] : undefined;
  };

  const slug = getArg('slug');
  const roomsJson = getArg('rooms-json');

  if (!slug || !roomsJson) {
    console.log('Usage: npx tsx scripts/generate-qr-pdf.ts --slug <slug> --rooms-json <path>');
    console.log('Le fichier JSON doit contenir un tableau de { roomNumber, qrToken }');
    process.exit(1);
  }

  const { readFileSync } = await import('fs');
  const rooms: RoomQR[] = JSON.parse(readFileSync(roomsJson, 'utf8'));
  const domain = getArg('domain') || 'localhost:5173';
  const estName = getArg('name') || slug;
  const outDir = resolve(process.cwd(), 'output');
  const outputPath = resolve(outDir, `qrcodes-${slug}.pdf`);

  const result = await generateQrPdf(rooms, { slug, estName, domain, outputPath });
  console.log(`PDF genere : ${result}`);
}
