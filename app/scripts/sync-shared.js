// Copies ../shared/src into src/shared so Metro resolves the @shared alias
// inside the project root. Metro's out-of-root resolution is unreliable on
// Windows; this sync runs automatically before start and typecheck.
const { cpSync, mkdirSync, rmSync } = require('node:fs');
const path = require('node:path');

const source = path.resolve(__dirname, '..', '..', 'shared', 'src');
const target = path.resolve(__dirname, '..', 'src', 'shared');

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
console.info(`Synced ${source} -> ${target}`);
