const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function removeDirectoryRecursive(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  for (const entry of fs.readdirSync(targetPath)) {
    const entryPath = path.join(targetPath, entry);
    const stats = fs.lstatSync(entryPath);
    if (stats.isDirectory()) {
      removeDirectoryRecursive(entryPath);
    } else {
      fs.unlinkSync(entryPath);
    }
  }
  fs.rmdirSync(targetPath);
}

function copyRecursiveSync(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    }
    return;
  }
  // file
  const parent = path.dirname(dest);
  if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
  fs.copyFileSync(src, dest);
}

function run(command, options = {}) {
  console.log(`> ${command}`);
  execSync(command, { stdio: 'inherit', ...options });
}

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const buildDir = path.join(projectRoot, 'build');

  // Clean build dir
  if (fs.existsSync(buildDir)) {
    console.log('Cleaning build directory...');
    removeDirectoryRecursive(buildDir);
  }
  fs.mkdirSync(buildDir, { recursive: true });

  // Copy application source and essential files
  const filesToCopy = [
    ['src', 'src'],
    ['package.json', 'package.json'],
    ['package-lock.json', 'package-lock.json'],
    ['README.md', 'README.md'],
  ];
  for (const [srcRel, destRel] of filesToCopy) {
    const srcPath = path.join(projectRoot, srcRel);
    if (fs.existsSync(srcPath)) {
      console.log(`Copying ${srcRel} -> ${destRel}`);
      copyRecursiveSync(srcPath, path.join(buildDir, destRel));
    }
  }

  // Optional helper files
  const optionalFiles = ['.env.example', 'ecosystem.config.js'];
  for (const name of optionalFiles) {
    const p = path.join(projectRoot, name);
    if (fs.existsSync(p)) {
      copyRecursiveSync(p, path.join(buildDir, name));
    }
  }

  // Install production dependencies inside build folder
  console.log('Installing production dependencies in build/...');
  try {
    // Prefer npm ci if lockfile present
    const hasLock = fs.existsSync(path.join(buildDir, 'package-lock.json'));
    if (hasLock) {
      run('npm ci --omit=dev', { cwd: buildDir });
    } else {
      run('npm install --production', { cwd: buildDir });
    }
  } catch (err) {
    console.error('Failed to install production dependencies in build/.');
    process.exit(1);
  }

  console.log('Build prepared in build/. You can zip and upload that folder.');
}

main();



