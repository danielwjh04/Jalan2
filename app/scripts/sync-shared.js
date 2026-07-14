// Copies ../shared/src into src/shared so Metro resolves the @shared alias
// inside the project root. Metro's out-of-root resolution is unreliable on
// Windows; this sync runs automatically before start and typecheck.
const { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } = require('node:fs');
const path = require('node:path');

const source = path.resolve(__dirname, '..', '..', 'shared', 'src');
const target = path.resolve(__dirname, '..', 'src', 'shared');

mkdirSync(target, { recursive: true });
removeStaleEntries(source, target);
cpSync(source, target, { recursive: true, force: true });
console.info(`Synced ${source} -> ${target}`);

function removeStaleEntries(sourceDir, targetDir) {
  for (const entry of readdirSync(targetDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    const sameType = existsSync(sourcePath)
      && statSync(sourcePath).isDirectory() === entry.isDirectory();
    if (!sameType) {
      rmSync(targetPath, { recursive: true, force: true });
    } else if (entry.isDirectory()) {
      removeStaleEntries(sourcePath, targetPath);
    }
  }
}
