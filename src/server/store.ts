import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
  PutCommand,
  DeleteCommand,
  TransactWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { seedMenu } from '../lib/data';
import { ApiError, type Reservation } from '../lib/schema';
export type RecordData = Record<string, unknown> & { id: string };
export interface Store {
  list<T>(kind: string): Promise<T[]>;
  get<T>(kind: string, id: string): Promise<T | undefined>;
  put(kind: string, item: RecordData): Promise<void>;
  remove(kind: string, id: string): Promise<void>;
  reserve(item: Reservation): Promise<boolean>;
  status(id: string, status: Reservation['status']): Promise<void>;
  limit(key: string, max: number): Promise<void>;
}
const CAPACITY = 24;
export class FileStore implements Store {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private file = resolve(process.env.LOCAL_DATA_PATH || '.data/aurel.json')) {}
  private run<T>(fn: (db: Record<string, RecordData[]>) => T | Promise<T>): Promise<T> {
    const task = this.queue.then(async () => {
      let db: Record<string, RecordData[]>;
      try {
        db = JSON.parse(await readFile(this.file, 'utf8'));
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
        db = { menu: seedMenu };
      }
      const result = await fn(db);
      await mkdir(dirname(this.file), { recursive: true, mode: 0o700 });
      await writeFile(this.file + '.tmp', JSON.stringify(db), { mode: 0o600 });
      await rename(this.file + '.tmp', this.file);
      return result;
    });
    this.queue = task.catch(() => {});
    return task;
  }
  list<T>(k: string) {
    return this.run((db) => (db[k] || []) as T[]);
  }
  get<T>(k: string, id: string) {
    return this.run((db) => (db[k] || []).find((x) => x.id === id) as T | undefined);
  }
  put(k: string, item: RecordData) {
    return this.run((db) => {
      db[k] = [...(db[k] || []).filter((x) => x.id !== item.id), item];
    });
  }
  remove(k: string, id: string) {
    return this.run((db) => {
      db[k] = (db[k] || []).filter((x) => x.id !== id);
    });
  }
  reserve(item: Reservation) {
    return this.run((db) => {
      const rows = (db.reservations || []) as unknown as Reservation[];
      if (rows.some((x) => x.id === item.id)) return false;
      const used = rows
        .filter((x) => x.date === item.date && x.time === item.time && x.status !== 'cancelled')
        .reduce((n, x) => n + x.guests, 0);
      if (used + item.guests > CAPACITY)
        throw new ApiError(409, 'Khung giờ đã đủ chỗ. Vui lòng chọn giờ khác.');
      db.reservations = [...rows, item];
      return true;
    });
  }
  status(id: string, status: Reservation['status']) {
    return this.run((db) => {
      const rows = (db.reservations || []) as unknown as Reservation[];
      const r = rows.find((x) => x.id === id);
      if (!r) throw new ApiError(404, 'Không tìm thấy đặt bàn');
      if (r.status === 'cancelled' && status !== 'cancelled') {
        const used = rows
          .filter((x) => x.date === r.date && x.time === r.time && x.status !== 'cancelled')
          .reduce((n, x) => n + x.guests, 0);
        if (used + r.guests > CAPACITY) throw new ApiError(409, 'Khung giờ đã đủ chỗ');
      }
      r.status = status;
    });
  }
  limit(key: string, max: number) {
    return this.run((db) => {
      const now = Date.now();
      db.limits = (db.limits || []).filter((x) => Number(x.expires) > now);
      const r = db.limits.find((x) => x.id === key);
      if (Number(r?.count || 0) >= max)
        throw new ApiError(429, 'Quá nhiều yêu cầu. Vui lòng thử lại sau.');
      if (r) r.count = Number(r.count) + 1;
      else db.limits.push({ id: key, count: 1, expires: now + 900000 });
    });
  }
}
export class DynamoStore implements Store {
  private client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
  private table = process.env.TABLE_NAME!;
  async list<T>(kind: string) {
    let cursor: Record<string, unknown> | undefined;
    const rows: T[] = [];
    do {
      const r = await this.client.send(
        new QueryCommand({
          TableName: this.table,
          ConsistentRead: true,
          KeyConditionExpression: 'pk = :pk',
          ExpressionAttributeValues: { ':pk': kind },
          ExclusiveStartKey: cursor,
        }),
      );
      rows.push(...(r.Items || []).map((x) => x.data as T));
      cursor = r.LastEvaluatedKey;
    } while (cursor);
    return rows;
  }
  async get<T>(kind: string, id: string) {
    const r = await this.client.send(
      new GetCommand({ TableName: this.table, Key: { pk: kind, sk: id }, ConsistentRead: true }),
    );
    return r.Item?.data as T | undefined;
  }
  async put(kind: string, item: RecordData) {
    await this.client.send(
      new PutCommand({ TableName: this.table, Item: { pk: kind, sk: item.id, data: item } }),
    );
  }
  async remove(kind: string, id: string) {
    await this.client.send(new DeleteCommand({ TableName: this.table, Key: { pk: kind, sk: id } }));
  }
  async reserve(item: Reservation) {
    if (await this.get('reservations', item.id)) return false;
    try {
      await this.client.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Update: {
                TableName: this.table,
                Key: { pk: 'slots', sk: item.date + '#' + item.time },
                UpdateExpression: 'ADD seats :n',
                ConditionExpression: 'attribute_not_exists(seats) OR seats <= :max',
                ExpressionAttributeValues: { ':n': item.guests, ':max': CAPACITY - item.guests },
              },
            },
            {
              Put: {
                TableName: this.table,
                Item: { pk: 'reservations', sk: item.id, data: item },
                ConditionExpression: 'attribute_not_exists(pk)',
              },
            },
          ],
        }),
      );
      return true;
    } catch (e) {
      if ((e as Error).name === 'TransactionCanceledException') {
        if (await this.get('reservations', item.id)) return false;
        throw new ApiError(409, 'Khung giờ đã đủ chỗ hoặc vừa thay đổi. Vui lòng thử lại.');
      }
      throw e;
    }
  }
  async status(id: string, status: Reservation['status']) {
    const r = await this.get<Reservation>('reservations', id);
    if (!r) throw new ApiError(404, 'Không tìm thấy đặt bàn');
    if (r.status === status) return;
    const delta = r.status === 'cancelled' ? r.guests : status === 'cancelled' ? -r.guests : 0;
    const tx: ConstructorParameters<typeof TransactWriteCommand>[0]['TransactItems'] = [
      {
        Put: {
          TableName: this.table,
          Item: { pk: 'reservations', sk: id, data: { ...r, status } },
          ConditionExpression: '#data.#status = :old',
          ExpressionAttributeNames: { '#data': 'data', '#status': 'status' },
          ExpressionAttributeValues: { ':old': r.status },
        },
      },
    ];
    if (delta)
      tx!.push({
        Update: {
          TableName: this.table,
          Key: { pk: 'slots', sk: r.date + '#' + r.time },
          UpdateExpression: 'ADD seats :n',
          ConditionExpression: delta > 0 ? 'seats <= :bound' : 'seats >= :bound',
          ExpressionAttributeValues: {
            ':n': delta,
            ':bound': delta > 0 ? CAPACITY - delta : -delta,
          },
        },
      });
    try {
      await this.client.send(new TransactWriteCommand({ TransactItems: tx }));
    } catch (e) {
      if ((e as Error).name === 'TransactionCanceledException')
        throw new ApiError(
          409,
          'Dữ liệu vừa thay đổi hoặc khung giờ đã đủ chỗ. Tải lại để thử lại.',
        );
      throw e;
    }
  }
  async limit(key: string, max: number) {
    try {
      await this.client.send(
        new UpdateCommand({
          TableName: this.table,
          Key: { pk: 'limits', sk: key },
          UpdateExpression: 'SET expires = :ttl ADD hits :one',
          ConditionExpression: 'attribute_not_exists(hits) OR hits < :max',
          ExpressionAttributeValues: {
            ':ttl': Math.floor(Date.now() / 1000) + 1800,
            ':one': 1,
            ':max': max,
          },
        }),
      );
    } catch (e) {
      if ((e as Error).name === 'ConditionalCheckFailedException')
        throw new ApiError(429, 'Quá nhiều yêu cầu. Vui lòng thử lại sau.');
      throw e;
    }
  }
}
let singleton: Store;
export function getStore() {
  if (!singleton) {
    if (process.env.DATA_MODE === 'aws') singleton = new DynamoStore();
    else if (process.env.DATA_MODE === 'local') singleton = new FileStore();
    else throw new Error('Set DATA_MODE=local or aws explicitly');
  }
  return singleton;
}
