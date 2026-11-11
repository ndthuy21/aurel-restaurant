import { writeFile } from 'node:fs/promises';
// Only non-secret configuration is written to the Amplify build artifact.
const names = [
  'DATA_MODE',
  'API_BASE_URL',
  'NEXT_PUBLIC_API_BASE_URL',
  'COGNITO_CLIENT_ID',
  'COGNITO_USER_POOL_ID',
  'APP_AWS_REGION',
  'APP_ORIGIN',
];
for (const name of names) if (!process.env[name]) throw new Error('Missing ' + name);
if (process.env.DATA_MODE !== 'aws') throw new Error('Amplify requires DATA_MODE=aws');
for (const name of ['API_BASE_URL', 'NEXT_PUBLIC_API_BASE_URL'])
  if (!process.env[name].startsWith('https://')) throw new Error('API URL must use HTTPS');
await writeFile(
  '.env.production',
  names.map((name) => `${name}=${JSON.stringify(process.env[name])}`).join('\n') + '\n',
);
