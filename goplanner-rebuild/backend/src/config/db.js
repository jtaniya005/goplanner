import mongoose from 'mongoose';
import { env } from './env.js';

export default async function connectDB() {
  const uri = `${env.mongoUri.replace(/\/$/, '')}/${env.dbName}`;
  mongoose.set('strictQuery', true);
  try {
    const conn = await mongoose.connect(uri, { autoIndex: env.nodeEnv !== 'production' });
    console.log(`[db] Connected to MongoDB at ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error('[db] MongoDB connection error:', err.message);
    throw err;
  }
}
