import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

await mongoose.connect('mongodb://127.0.0.1:27017/goplanner');

// Delete all existing users
await mongoose.connection.db.collection('users').deleteMany({});
console.log('✅ Cleared all users');

// Create a fresh user with known credentials
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash('taniya123', salt);

await mongoose.connection.db.collection('users').insertOne({
  name: 'Taniya',
  email: 'taniya@gmail.com',
  password: hashedPassword,
  homeCurrency: 'USD',
  createdAt: new Date(),
  updatedAt: new Date()
});

console.log('✅ Created user:');
console.log('   Email: taniya@gmail.com');
console.log('   Password: taniya123');

await mongoose.disconnect();
