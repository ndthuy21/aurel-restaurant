/** Replace only the original eight demo dishes. Never touches bookings or contacts. */
import { mkdir, writeFile } from 'node:fs/promises';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { seedMenu } from '../src/lib/data';
import { menuSchema } from '../src/lib/schema';

const table = process.env.TABLE_NAME;
if (!table) throw new Error('Set TABLE_NAME and AWS_REGION, authenticate AWS CLI first.');
if (seedMenu.length !== 100) throw new Error('Expected the verified 100-dish catalog.');
seedMenu.forEach((item) => menuSchema.parse(item));
const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const rows: { pk: string; sk: string; data: Record<string, unknown> }[] = [];
let cursor: Record<string, unknown> | undefined;
do {
  const response = await client.send(
    new QueryCommand({
      TableName: table,
      ConsistentRead: true,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': 'menu' },
      ExclusiveStartKey: cursor,
    }),
  );
  rows.push(...((response.Items || []) as typeof rows));
  cursor = response.LastEvaluatedKey;
} while (cursor);
const oldNames: Record<string, string> = {
  scallop: 'Sò điệp · Bơ nâu',
  garden: 'Khu vườn Đà Lạt',
  duck: 'Vịt · Cam · Tiêu rừng',
  fish: 'Cá tuyết · Miso trắng',
  mushroom: 'Risotto nấm rừng',
  chocolate: 'Sô-cô-la · Muối biển',
  pear: 'Lê · Hoa hồi',
  tea: 'Trà chiều hổ phách',
};
const known = new Set(seedMenu.map((item) => item.id));
for (const row of rows) {
  if (!known.has(row.sk) && oldNames[row.sk] !== row.data.name)
    throw new Error(
      `Preserving custom or modified item ${row.sk}; review it before replacing the demo menu.`,
    );
}
const existing = new Set(rows.map((row) => row.sk));
const additions = seedMenu.filter((item) => !existing.has(item.id));
const removals = rows.filter((row) => oldNames[row.sk] === row.data.name);
console.log(
  `Plan: add ${additions.length}, preserve ${rows.length - removals.length}, retire ${removals.length} original demo dishes.`,
);
if (!process.argv.includes('--apply')) {
  console.log('Dry run only. Run again with --apply to create a backup and apply this plan.');
} else {
  await mkdir('.data', { recursive: true, mode: 0o700 });
  const backup = `.data/menu-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  await writeFile(backup, JSON.stringify(rows, null, 2), { mode: 0o600 });
  console.log('Menu-only backup:', backup);
  if (additions.length)
    await client.send(
      new TransactWriteCommand({
        TransactItems: additions.map((item) => ({
          Put: {
            TableName: table,
            Item: { pk: 'menu', sk: item.id, data: item },
            ConditionExpression: 'attribute_not_exists(pk)',
          },
        })),
      }),
    );
  if (removals.length)
    await client.send(
      new TransactWriteCommand({
        TransactItems: removals.map((row) => ({
          Delete: {
            TableName: table,
            Key: { pk: 'menu', sk: row.sk },
            ConditionExpression: '#data = :old',
            ExpressionAttributeNames: { '#data': 'data' },
            ExpressionAttributeValues: { ':old': row.data },
          },
        })),
      }),
    );
  console.log('Menu migration complete. Existing catalog items were preserved.');
}
