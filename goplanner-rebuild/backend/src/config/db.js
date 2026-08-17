import mongoose from 'mongoose';
import { env } from './env.js';

export default async function connectDB() {
  mongoose.set('strictQuery', true);
  try {
    const conn = await mongoose.connect(env.mongoUri, {
      dbName: env.dbName,
      autoIndex: env.nodeEnv !== 'production',
    });
    console.log(`[db] Connected to MongoDB at ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error('[db] MongoDB connection error:', err.message);
    throw err;
  }
}
