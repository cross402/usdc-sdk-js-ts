const external = ['camelcase-keys', 'decamelize-keys', 'zod', 'commander'];

const mainEntrypoints = ['./src/index.ts', './src/server.ts', './src/browser.ts'];

async function bundle(): Promise<void> {
  const base = { target: 'node' as const, external };

  for (const format of ['esm', 'cjs'] as const) {
    const outdir = format === 'esm' ? './dist/esm' : './dist/cjs';
    const result = await Bun.build({
      entrypoints: [...mainEntrypoints],
      outdir,
      format,
      ...base,
    });
    if (!result.success) {
      console.error(result.logs);
      throw new Error(`Bun.build failed (${format}, library entries)`);
    }
  }

  const cli = await Bun.build({
    entrypoints: ['./src/cli/index.ts'],
    outdir: './dist/cli',
    format: 'esm',
    ...base,
  });
  if (!cli.success) {
    console.error(cli.logs);
    throw new Error('Bun.build failed (cli)');
  }
}

if (import.meta.main) {
  await bundle();
}
