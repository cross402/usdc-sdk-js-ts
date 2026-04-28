import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
delete pkg.sideEffects;
writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
try {
  // Must be a subprocess so Bun re-reads package.json without sideEffects
  execSync('bun run bundle.ts', { stdio: 'inherit' });
} finally {
  pkg.sideEffects = false;
  writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
}

execSync('tsc -p tsconfig.build.json', { stdio: 'inherit' });
execSync('tsc -p tsconfig.build.cjs.json', { stdio: 'inherit' });
writeFileSync('dist/cjs/package.json', JSON.stringify({ type: 'commonjs' }) + '\n');