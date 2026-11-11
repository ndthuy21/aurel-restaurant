import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { seedMenu } from '../src/lib/data';
if (!process.env.TABLE_NAME)
  throw new Error('Set TABLE_NAME and AWS_REGION, authenticate AWS CLI first');
const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
for (const item of seedMenu) {
  try {
    await client.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: { pk: 'menu', sk: item.id, data: item },
        ConditionExpression: 'attribute_not_exists(pk)',
      }),
    );
    console.log('Created', item.id);
  } catch (e) {
    if ((e as Error).name === 'ConditionalCheckFailedException') console.log('Preserved', item.id);
    else throw e;
  }
}
