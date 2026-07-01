import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean database
  await prisma.tour.deleteMany({});
  await prisma.prospect.deleteMany({});
  await prisma.unit.deleteMany({});
  await prisma.agent.deleteMany({});

  console.log('Database cleaned.');

  // Create Agents
  const agent1 = await prisma.agent.create({
    data: {
      name: 'Sarah Conner',
    }
  });

  const agent2 = await prisma.agent.create({
    data: {
      name: 'John Connor',
    }
  });

  console.log('Created agents.');

  // Create Units
  const u101 = await prisma.unit.create({
    data: {
      number: '101',
      status: 'held',
      rent: 1200.0,
      bedrooms: 1,
      bathrooms: 1.0
    }
  });

  const u102 = await prisma.unit.create({
    data: {
      number: '102',
      status: 'leased',
      rent: 1600.0,
      bedrooms: 2,
      bathrooms: 2.0
    }
  });

  const u201 = await prisma.unit.create({
    data: {
      number: '201',
      status: 'available',
      rent: 1250.0,
      bedrooms: 1,
      bathrooms: 1.0
    }
  });

  const u202 = await prisma.unit.create({
    data: {
      number: '202',
      status: 'leased',
      rent: 1450.0,
      bedrooms: 2,
      bathrooms: 1.0
    }
  });

  const u301 = await prisma.unit.create({
    data: {
      number: '301',
      status: 'available',
      rent: 950.0,
      bedrooms: 0, // Studio
      bathrooms: 1.0
    }
  });

  const u302 = await prisma.unit.create({
    data: {
      number: '302',
      status: 'available',
      rent: 2100.0,
      bedrooms: 3,
      bathrooms: 2.0
    }
  });

  console.log('Created units.');

  // Create Prospects
  await prisma.prospect.create({
    data: {
      name: 'Alice Smith',
      email: 'alice.smith@example.com',
      phone: '555-0192',
      status: 'new',
      notes: 'Interested in a 1 Bed 1 Bath, preferred move-in September.',
      assignedUnitId: null,
      agentId: agent1.id
    }
  });

  await prisma.prospect.create({
    data: {
      name: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      phone: '555-0143',
      status: 'contacted',
      notes: 'Sent initial pricing list. Prefers lower floors, parking space is a must.',
      assignedUnitId: null,
      agentId: agent2.id
    }
  });

  const charlie = await prisma.prospect.create({
    data: {
      name: 'Charlie Brown',
      email: 'charlie.brown@example.com',
      phone: '555-0177',
      status: 'tour_scheduled',
      notes: 'Tour scheduled for Wednesday at 2 PM. Showed interest in Unit 101.',
      assignedUnitId: u101.id,
      agentId: agent1.id
    }
  });

  const nextWednesday = new Date();
  nextWednesday.setDate(nextWednesday.getDate() + (3 + 7 - nextWednesday.getDay()) % 7);
  nextWednesday.setHours(14, 0, 0, 0);

  await prisma.tour.create({
    data: {
      prospectId: charlie.id,
      unitId: u201.id,
      scheduledTime: nextWednesday,
      status: 'scheduled'
    }
  });

  await prisma.prospect.create({
    data: {
      name: 'Diana Prince',
      email: 'diana.prince@example.com',
      phone: '555-0111',
      status: 'toured',
      notes: 'Toured Unit 201. Loved the natural lighting and kitchen size. Thinking about applying by end of week.',
      assignedUnitId: u201.id
    }
  });

  await prisma.prospect.create({
    data: {
      name: 'Evan Wright',
      email: 'evan.wright@example.com',
      phone: '555-0155',
      status: 'application',
      notes: 'Application submitted. Running background check and reference verifications.',
      assignedUnitId: u102.id
    }
  });

  await prisma.prospect.create({
    data: {
      name: 'Fiona Gallagher',
      email: 'fiona.g@example.com',
      phone: '555-0188',
      status: 'leased',
      notes: 'Lease signed. Paid first month and deposit. Move-in scheduled for July 15th.',
      assignedUnitId: u202.id
    }
  });

  await prisma.prospect.create({
    data: {
      name: 'George Bluth',
      email: 'george.b@example.com',
      phone: '555-0199',
      status: 'lost',
      notes: 'Tour completed but selected another apartment complex closer to his office.',
      assignedUnitId: null
    }
  });

  console.log('Created prospects.');
  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
