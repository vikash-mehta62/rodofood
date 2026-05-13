/**
 * Test script — sends all email types to a test address
 * Run: node src/utils/testEmails.js
 */
require('dotenv').config();

const { sendOrderConfirmationEmail, sendNewOrderEmailToRestaurant, sendOrderStatusEmail, sendOverdueOrderAlert } = require('./emailService');

const TEST_EMAIL = 'vikasmaheshwari6267@gmail.com';

const mockOrder = {
  orderNumber: 'RF20260001',
  status: 'confirmed',
  orderType: 'takeaway',
  paymentMethod: 'online',
  paymentStatus: 'paid',
  customerETA: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  subtotal: 320,
  discount: 50,
  gstRate: 5,
  gstAmount: 13.5,
  totalAmount: 283.5,
  couponCode: 'FIRST50',
  rejectionReason: null,
  restaurant: { name: 'Indore Sarafa Sweets', address: { city: 'Indore' } },
  items: [
    { name: 'Dal Makhani', price: 180, quantity: 1, foodType: 'veg' },
    { name: 'Butter Naan x2', price: 80, quantity: 1, foodType: 'veg' },
    { name: 'Lassi', price: 60, quantity: 1, foodType: 'veg' },
  ],
};

async function runTests() {
  console.log('📧 Sending test emails to', TEST_EMAIL);
  console.log('─────────────────────────────────────────');

  // 1. Customer order confirmation
  console.log('1️⃣  Sending customer order confirmation...');
  const r1 = await sendOrderConfirmationEmail(TEST_EMAIL, { order: mockOrder, customerName: 'Vikas' });
  console.log('   Result:', r1.success ? '✅ Sent' : '❌ Failed');

  // 2. Restaurant new order notification
  console.log('2️⃣  Sending restaurant new order notification...');
  const r2 = await sendNewOrderEmailToRestaurant(TEST_EMAIL, { order: mockOrder, restaurantName: 'Indore Sarafa Sweets' });
  console.log('   Result:', r2.success ? '✅ Sent' : '❌ Failed');

  // 3. Order status update — confirmed
  console.log('3️⃣  Sending status update (confirmed)...');
  const r3 = await sendOrderStatusEmail(TEST_EMAIL, { order: mockOrder, customerName: 'Vikas', status: 'confirmed' });
  console.log('   Result:', r3.success ? '✅ Sent' : '❌ Failed');

  // 4. Order status update — ready
  console.log('4️⃣  Sending status update (ready)...');
  const r4 = await sendOrderStatusEmail(TEST_EMAIL, { order: mockOrder, customerName: 'Vikas', status: 'ready' });
  console.log('   Result:', r4.success ? '✅ Sent' : '❌ Failed');

  // 5. Overdue order alert to restaurant
  console.log('5️⃣  Sending overdue order alert...');
  const r5 = await sendOverdueOrderAlert(TEST_EMAIL, { order: mockOrder, restaurantName: 'Indore Sarafa Sweets', minutesOverdue: 25 });
  console.log('   Result:', r5.success ? '✅ Sent' : '❌ Failed');

  console.log('─────────────────────────────────────────');
  console.log('✅ All test emails sent! Check', TEST_EMAIL);
  process.exit(0);
}

runTests().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
