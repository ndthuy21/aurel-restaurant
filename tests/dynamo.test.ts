import { afterEach, expect, it, vi } from 'vitest';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoStore } from '../src/server/store';
import { randomUUID } from 'node:crypto';
afterEach(() => vi.restoreAllMocks());
it('Dynamo reservation uses atomic conditional capacity increment and unique insert', async () => {
  const send = vi
    .spyOn(DynamoDBDocumentClient.prototype, 'send')
    .mockResolvedValueOnce({} as never)
    .mockResolvedValueOnce({} as never);
  const item = {
    id: randomUUID(),
    name: 'Test',
    email: 'a@b.com',
    phone: '0901234567',
    date: '2099-01-01',
    time: '19:00',
    guests: 8,
    consent: true as const,
    notes: '',
    website: '',
    status: 'pending' as const,
    createdAt: 'now',
  };
  await new DynamoStore().reserve(item);
  const command = send.mock.calls[1][0] as unknown as { input: { TransactItems: unknown[] } };
  expect(command.input.TransactItems).toHaveLength(2);
  expect(command.input.TransactItems[0]).toMatchObject({
    Update: { ExpressionAttributeValues: { ':n': 8, ':max': 16 } },
  });
  expect(command.input.TransactItems[1]).toMatchObject({
    Put: { ConditionExpression: 'attribute_not_exists(pk)' },
  });
});
it('Dynamo list follows pagination instead of dropping later pages', async () => {
  vi.spyOn(DynamoDBDocumentClient.prototype, 'send')
    .mockResolvedValueOnce({
      Items: [{ data: { id: 'a' } }],
      LastEvaluatedKey: { pk: 'menu', sk: 'a' },
    } as never)
    .mockResolvedValueOnce({ Items: [{ data: { id: 'b' } }] } as never);
  expect(await new DynamoStore().list('menu')).toEqual([{ id: 'a' }, { id: 'b' }]);
});
