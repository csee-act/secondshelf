import { cpSync, mkdirSync, writeFileSync, readdirSync, lstatSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist');
// This generated folder is always resolved beneath the project before replacing it.
if (dirname(output) !== root || output === root) throw new Error('Unsafe output directory.');
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
function rejectLinks(path) {
  for (const entry of readdirSync(path)) {
    const target = join(path, entry), stat = lstatSync(target);
    if (stat.isSymbolicLink()) throw new Error('Public assets must not contain symbolic links.');
    if (stat.isDirectory()) rejectLinks(target);
  }
}
rejectLinks(resolve(root, 'public'));
// Only explicitly public assets are deployed; no database, server, or .env files.
cpSync(resolve(root, 'public'), output, { recursive: true });
writeFileSync(resolve(output, 'app-mode.js'), "export const APP_MODE = 'browser';\n");
writeFileSync(resolve(output, '.nojekyll'), '');
console.log('GitHub Pages build ready in dist/ (browser storage, local demo community).');
