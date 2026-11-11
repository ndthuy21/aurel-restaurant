import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
if (!process.env.USER_POOL_ID || !process.env.ADMIN_EMAIL)
  throw new Error('Set USER_POOL_ID, ADMIN_EMAIL, AWS_REGION and authenticate AWS first.');
if (!process.stdin.isTTY)
  throw new Error(
    'Run this script in an interactive terminal. Password is never accepted in arguments.',
  );
const hidden = new Writable({
  write(_chunk, _encoding, done) {
    done();
  },
});
const reader = createInterface({ input: process.stdin, output: hidden, terminal: true });
let password;
try {
  process.stdout.write('New admin password (hidden): ');
  password = await reader.question('');
  process.stdout.write('\n');
  process.stdout.write('Confirm password (hidden): ');
  const confirmation = await reader.question('');
  process.stdout.write('\n');
  if (password !== confirmation) throw new Error('Passwords do not match.');
  if (
    password.length < 14 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[\W_]/.test(password)
  )
    throw new Error('Use at least 14 characters with uppercase, lowercase, number and symbol.');
} finally {
  reader.close();
}
const client = new CognitoIdentityProviderClient({});
const UserPoolId = process.env.USER_POOL_ID;
const Username = process.env.ADMIN_EMAIL;
// Intentionally refuse to overwrite an existing account's credentials.
await client.send(
  new AdminCreateUserCommand({
    UserPoolId,
    Username,
    MessageAction: 'SUPPRESS',
    UserAttributes: [{ Name: 'email', Value: Username }],
  }),
);
await client.send(
  new AdminSetUserPasswordCommand({ UserPoolId, Username, Password: password, Permanent: true }),
);
password = undefined;
await client.send(new AdminAddUserToGroupCommand({ UserPoolId, Username, GroupName: 'admin' }));
console.log(
  'Admin created with permanent password and admin group. No invitation sent. Verify the email separately before enabling recovery.',
);
