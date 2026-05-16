import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env: prefer project root .env, fall back to src/.env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
if (!process.env.MONGO_URL && !process.env.MONGO_URI) {
  dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
}
const db_name = process.env.DB_NAME || 'goplanner';
const getMongoUri = () => `${process.env.MONGO_URI}/${db_name}`;

export default async function connectDB() {
  const uri = getMongoUri();
  try {
   const response = await mongoose.connect(uri, { autoIndex: true });
    console.log('Connected to MongoDB',response.connection.host);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
}