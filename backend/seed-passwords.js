require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = require('./src/models/User');
  const hash = await bcrypt.hash('12345678', 12);

  // Update all users that don't have a password yet
  const r1 = await User.updateMany({ password: { $exists: false } }, { $set: { password: hash } });
  const r2 = await User.updateMany({ password: null }, { $set: { password: hash } });
  console.log('Seeded:', r1.modifiedCount + r2.modifiedCount, 'users with password 12345678');

  const users = await User.find({}).select('name phone role').lean();
  console.log('\nAll users:');
  users.forEach(u => console.log(' ', u.role.padEnd(12), u.phone, ' ', u.name || '(no name)'));

  mongoose.disconnect();
}).catch(e => { console.error(e); process.exit(1); });
