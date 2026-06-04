const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const publicDir = path.join(__dirname, '..', 'public');

// Exclude list (e.g. system files, logos, svgs)
const excludeFiles = [
  'logo.png', 
  'graphitex_logo-01.png', 
  'placeholder-avatar.svg', 
  'file.svg', 
  'globe.svg', 
  'next.svg', 
  'vercel.svg', 
  'window.svg'
];

function shouldProcess(filename) {
  if (excludeFiles.includes(filename)) return false;
  if (filename.toLowerCase().includes('logo')) return false; // Safety check to never touch logos
  const ext = path.extname(filename).toLowerCase();
  return ['.png', '.jpg', '.jpeg'].includes(ext);
}

// Keep track of files currently processing to prevent double trigger loops
const processingFiles = new Set();

async function processImage(filename) {
  if (processingFiles.has(filename)) return;
  processingFiles.add(filename);

  const inputPath = path.join(publicDir, filename);
  const ext = path.extname(filename);
  const baseName = path.basename(filename, ext);
  const outputName = `${baseName}.webp`;
  const outputPath = path.join(publicDir, outputName);

  // Wait a brief moment to ensure the file copy is finished on the disk
  await new Promise(resolve => setTimeout(resolve, 800));

  if (!fs.existsSync(inputPath)) {
    processingFiles.delete(filename);
    return;
  }

  console.log(`[Auto-Compress] 📷 New unoptimized image detected: ${filename}`);
  try {
    await sharp(inputPath)
      .resize({ width: 1600, withoutEnlargement: true }) // Limit banner width for optimal web sizing
      .webp({ quality: 80 }) // Compress to high-efficiency webp
      .toFile(outputPath);

    console.log(`[Auto-Compress] ✔ Successfully compressed to ${outputName}`);
    
    // Delete the original file
    fs.unlinkSync(inputPath);
    console.log(`[Auto-Compress] 🗑 Deleted original file: ${filename}`);
  } catch (err) {
    console.error(`[Auto-Compress] ❌ Error processing ${filename}:`, err);
  } finally {
    processingFiles.delete(filename);
  }
}

// Initial scan to clean up directory
async function initialScan() {
  try {
    const files = fs.readdirSync(publicDir);
    for (const file of files) {
      if (shouldProcess(file)) {
        await processImage(file);
      }
    }
  } catch (err) {
    console.error('[Auto-Compress] Initial scan error:', err);
  }
}

// Watcher mode using built-in fs.watch
function startWatcher() {
  console.log(`[Auto-Compress] 🔍 Watching public folder for new images: ${publicDir}`);
  fs.watch(publicDir, (eventType, filename) => {
    if (eventType === 'rename' && filename && shouldProcess(filename)) {
      const fullPath = path.join(publicDir, filename);
      if (fs.existsSync(fullPath)) {
        // File exists, meaning it was added or modified
        processImage(filename);
      }
    }
  });
}

async function main() {
  await initialScan();

  const isWatchMode = process.argv.includes('--watch');
  if (isWatchMode) {
    startWatcher();
    
    console.log('[Auto-Compress] Spawning Next.js development server...');
    const nextDev = spawn('npx', ['next', 'dev'], { 
      stdio: 'inherit',
      shell: true
    });

    nextDev.on('close', (code) => {
      process.exit(code);
    });
  }
}

main();
