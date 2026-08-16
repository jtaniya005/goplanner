import mongoose from 'mongoose';

await mongoose.connect('mongodb://127.0.0.1:27017/goplanner');

const result = await mongoose.connection.db.collection('users').updateOne(
  { email: 'taniya@gmail.com' },
  { $set: { homeCurrency: 'INR' } }
);

console.log('Updated user currency to INR:', result.modifiedCount);

await mongoose.disconnect();
