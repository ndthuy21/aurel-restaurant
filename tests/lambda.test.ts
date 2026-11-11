import { expect, it } from 'vitest';
import type { APIGatewayProxyEventV2WithJWTAuthorizer, Context } from 'aws-lambda';
import { handler } from '../src/aws/handler';
function event(claims: Record<string, string>) {
  return {
    rawPath: '/admin/session',
    requestContext: {
      http: { method: 'GET', sourceIp: '127.0.0.1' },
      authorizer: { jwt: { claims } },
    },
  } as unknown as APIGatewayProxyEventV2WithJWTAuthorizer;
}
it('Lambda requires both an access token and the exact admin group', async () => {
  for (const claims of [
    { token_use: 'id', 'cognito:groups': 'admin' },
    { token_use: 'access', 'cognito:groups': 'customer' },
    { token_use: 'access', 'cognito:groups': 'superadmin' },
  ]) {
    const r = await handler(event(claims), {} as Context, () => {});
    expect(r).toMatchObject({ statusCode: 401 });
  }
});
it('Lambda accepts gateway-verified access claims for the admin group', async () => {
  const r = await handler(
    event({ token_use: 'access', 'cognito:groups': '["customer","admin"]' }),
    {} as Context,
    () => {},
  );
  expect(r).toMatchObject({ statusCode: 200, body: '{"admin":true}' });
});
