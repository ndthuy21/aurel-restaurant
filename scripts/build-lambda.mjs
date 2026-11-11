import { build } from 'esbuild';
await build({
  entryPoints: ['src/aws/handler.ts'],
  outfile: 'dist/lambda/index.js',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  minify: true,
});
await build({
  entryPoints: ['scripts/seed-aws.ts'],
  outfile: 'dist/seed-aws.mjs',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  external: ['@aws-sdk/*'],
});

await build({
  entryPoints: ['scripts/replace-demo-menu.ts'],
  outfile: 'dist/replace-demo-menu.mjs',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  external: ['@aws-sdk/*'],
});
