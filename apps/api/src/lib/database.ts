import { createConnection } from 'mongoose';
import { connectModels } from '../models/index.js';

export async function openDatabase(uri: string) {
  const connection = createConnection(uri, {
    autoIndex: false,
    serverSelectionTimeoutMS: 5_000,
    readPreference: 'primary',
    writeConcern: { w: 'majority' },
  });

  try {
    await connection.asPromise();
    const mongo = connection.getClient().db(connection.name);
    const topology = await mongo.command({ hello: 1 });
    if (!topology.setName && topology.msg !== 'isdbgrid') {
      throw new Error('MongoDB must support replica-set transactions.');
    }
    const models = connectModels(connection);
    await Promise.all(Object.values(models).map(model => model.createIndexes()));
    return { connection, mongo, models };
  } catch (error) {
    await connection.close();
    throw error;
  }
}

export type Database = Awaited<ReturnType<typeof openDatabase>>;
