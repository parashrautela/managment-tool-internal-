import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const iconsDir = path.resolve(process.cwd(), 'public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Regular Icon SVG template
function getSvg(size, maskable = false) {
  const rx = maskable ? '0' : Math.round(size * 0.22);
  const padding = maskable ? Math.round(size * 0.1) : 0;
  const innerSize = size - padding * 2;
  const scale = innerSize / 40;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${maskable ? `<rect width="${size}" height="${size}" fill="#7360df"/>` : ''}
    <g transform="translate(${padding}, ${padding})">
      ${!maskable ? `<rect width="${innerSize}" height="${innerSize}" rx="${rx}" fill="#7360df"/>` : ''}
      <g transform="scale(${scale})">
        <path d="M11 13h18v6H17v10h-6z" fill="white"/>
        <path d="M21 23h8v6h-8z" fill="#c8bdff"/>
      </g>
    </g>
  </svg>`;
}

fs.writeFileSync(path.join(iconsDir, 'icon-192.svg'), getSvg(192, false));
fs.writeFileSync(path.join(iconsDir, 'icon-512.svg'), getSvg(512, false));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-192.svg'), getSvg(192, true));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512.svg'), getSvg(512, true));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), getSvg(180, false));

// Save master icon.svg in public/
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), getSvg(512, false));

console.log('SVGs created in public/icons/');

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function convertSvgToPng(svgPath, pngPath, size) {
  return new Promise((resolve, reject) => {
    const fileUrl = 'file://' + svgPath;
    const proc = spawn(chromePath, [
      '--headless',
      '--disable-gpu',
      `--window-size=${size},${size}`,
      `--screenshot=${pngPath}`,
      '--default-background-color=00000000',
      fileUrl,
    ]);

    proc.on('close', code => {
      if (code === 0) {
        console.log(`Generated ${path.basename(pngPath)} (${size}x${size})`);
        resolve();
      } else {
        reject(new Error(`Chrome exited with code ${code}`));
      }
    });
  });
}

async function main() {
  await convertSvgToPng(path.join(iconsDir, 'icon-192.svg'), path.join(iconsDir, 'icon-192x192.png'), 192);
  await convertSvgToPng(path.join(iconsDir, 'icon-512.svg'), path.join(iconsDir, 'icon-512x512.png'), 512);
  await convertSvgToPng(path.join(iconsDir, 'icon-maskable-192.svg'), path.join(iconsDir, 'icon-maskable-192x192.png'), 192);
  await convertSvgToPng(path.join(iconsDir, 'icon-maskable-512.svg'), path.join(iconsDir, 'icon-maskable-512x512.png'), 512);
  await convertSvgToPng(path.join(iconsDir, 'apple-touch-icon.svg'), path.join(iconsDir, 'apple-touch-icon.png'), 180);
  console.log('All PWA icons generated successfully.');
}

main().catch(console.error);
