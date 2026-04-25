// Seed data for demo - pre-populate the docket with interesting cases

import { db } from '../lib/db';

async function seedCases() {
  console.log('🌱 Seeding demo cases...');

  // Case 1: The classic flight booking
  const case1 = await db.cases.create({
    data: {
      task: 'Find the cheapest refundable flight from San Francisco to New York next Friday and prepare a booking recommendation.',
      status: 'COMPLETED',
      verdict: 'RETRY',
      sentence: 'RETRY_WITH_WUNDERGRAPH',
    },
  });
  console.log(`✅ Created case: ${case1.id}`);

  // Case 2: Wrong day ticket
  const case2 = await db.cases.create({
    data: {
      task: 'Book a round-trip flight from LAX to Boston for the tech conference next month.',
      status: 'COMPLETED',
      verdict: 'REJECTED',
      sentence: 'REJECTED',
    },
  });
  console.log(`✅ Created case: ${case2.id}`);

  // Case 3: Budget violation
  const case3 = await db.cases.create({
    data: {
      task: 'Find a hotel near Times Square under $200/night for 3 nights.',
      status: 'COMPLETED',
      verdict: 'REJECTED',
      sentence: 'BUDGET_VIOLATION',
    },
  });
  console.log(`✅ Created case: ${case3.id}`);

  // Case 4: Pending (for live demo)
  const case4 = await db.cases.create({
    data: {
      task: 'Find the cheapest refundable flight from Seattle to Miami next Tuesday.',
      status: 'PENDING',
      verdict: null,
      sentence: null,
    },
  });
  console.log(`✅ Created case: ${case4.id}`);

  console.log('\n🎉 Seed complete! Docket populated with 4 cases.');
  console.log(`\n📋 View them at: http://localhost:3000`);
}

seedCases().catch(console.error);
