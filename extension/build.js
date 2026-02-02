const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy static files
function copyPublicFiles() {
  const publicDir = path.join(__dirname, 'public');
  const files = fs.readdirSync(publicDir);
  
  for (const file of files) {
    const srcPath = path.join(publicDir, file);
    const destPath = path.join(distDir, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  console.log('Copied public files to dist/');
}

// Build options
const buildOptions = {
  bundle: true,
  minify: !isWatch,
  sourcemap: isWatch,
  target: ['chrome90'],
  logLevel: 'info',
};

// Build content script
async function buildContent() {
  await esbuild.build({
    ...buildOptions,
    entryPoints: ['src/content/content.ts'],
    outfile: 'dist/content.js',
  });
}

// Build background script
async function buildBackground() {
  await esbuild.build({
    ...buildOptions,
    entryPoints: ['src/background/background.ts'],
    outfile: 'dist/background.js',
    format: 'esm',
  });
}

// Build popup
async function buildPopup() {
  await esbuild.build({
    ...buildOptions,
    entryPoints: ['src/popup/popup.ts'],
    outfile: 'dist/popup.js',
  });
}

async function build() {
  copyPublicFiles();
  await Promise.all([buildContent(), buildBackground(), buildPopup()]);
  console.log('Build complete!');
}

if (isWatch) {
  console.log('Watching for changes...');
  // Simple watch implementation
  const srcDir = path.join(__dirname, 'src');
  
  build();
  
  fs.watch(srcDir, { recursive: true }, (eventType, filename) => {
    console.log(`File changed: ${filename}`);
    build().catch(console.error);
  });
} else {
  build().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
