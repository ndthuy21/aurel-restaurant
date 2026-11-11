import { createHash, timingSafeEqual } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  GlobalSignOutCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { ApiError } from '../lib/schema';
export const cookieName = 'aurel_session';
function key() {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)
    throw new Error('SESSION_SECRET must be at least 32 characters');
  return new TextEncoder().encode(process.env.SESSION_SECRET);
}
const equal = (a: string, b: string) =>
  timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
export async function localAdmin(token?: string) {
  if (!token) return false;
  try {
    const r = await jwtVerify(token, key(), {
      algorithms: ['HS256'],
      issuer: 'aurel-local',
      audience: 'aurel-admin',
    });
    return r.payload.role === 'admin';
  } catch {
    return false;
  }
}
export async function login(email: string, password: string) {
  if (process.env.DATA_MODE === 'aws') {
    try {
      const r = await new CognitoIdentityProviderClient({
        region: process.env.APP_AWS_REGION || process.env.AWS_REGION,
      }).send(
        new InitiateAuthCommand({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: process.env.COGNITO_CLIENT_ID,
          AuthParameters: { USERNAME: email, PASSWORD: password },
        }),
      );
      if (!r.AuthenticationResult?.AccessToken)
        throw new ApiError(401, 'Tài khoản cần hoàn tất thiết lập mật khẩu/MFA qua Cognito.');
      return r.AuthenticationResult.AccessToken;
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError(401, 'Đăng nhập không thành công. Kiểm tra tài khoản hoặc thử lại sau.');
    }
  }
  if (
    process.env.DATA_MODE !== 'local' ||
    !process.env.LOCAL_ADMIN_PASSWORD ||
    !process.env.LOCAL_ADMIN_EMAIL
  )
    throw new ApiError(503, 'Chưa cấu hình đăng nhập');
  if (
    !equal(email, process.env.LOCAL_ADMIN_EMAIL) ||
    !equal(password, process.env.LOCAL_ADMIN_PASSWORD)
  )
    throw new ApiError(401, 'Email hoặc mật khẩu không đúng');
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('aurel-local')
    .setAudience('aurel-admin')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key());
}
export async function revoke(token: string) {
  if (process.env.DATA_MODE === 'aws')
    try {
      await new CognitoIdentityProviderClient({
        region: process.env.APP_AWS_REGION || process.env.AWS_REGION,
      }).send(new GlobalSignOutCommand({ AccessToken: token }));
    } catch {
      /* Cookie is cleared even when a session already expired. */
    }
}
