import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { service, errorResponse } from '../server/service';
import { ApiError } from '../lib/schema';
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const path = event.rawPath;
    const claims =
      'authorizer' in event.requestContext
        ? (
            event.requestContext.authorizer as
              { jwt?: { claims?: Record<string, unknown> } } | undefined
          )?.jwt?.claims
        : undefined;
    const groups = String(claims?.['cognito:groups'] || '')
      .replace(/[\[\]" ]/g, '')
      .split(',');
    const admin = claims?.token_use === 'access' && groups.includes('admin');
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString()
      : event.body;
    if (raw && Buffer.byteLength(raw) > 16384) throw new ApiError(413, 'Yêu cầu quá lớn');
    let body: unknown;
    try {
      body = raw ? JSON.parse(raw) : undefined;
    } catch {
      throw new ApiError(400, 'JSON không hợp lệ');
    }
    const result = await service(event.requestContext.http.method, path, body, {
      admin,
      ip: event.requestContext.http.sourceIp,
    });
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify(result),
    };
  } catch (e) {
    const r = errorResponse(e);
    return {
      statusCode: r.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify(r.body),
    };
  }
};
