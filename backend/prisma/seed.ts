import { prisma } from '../src/db.js';

async function main() {
  // Clean database in dependency order
  await prisma.tour.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.statusHistory.deleteMany({});
  await prisma.prospect.deleteMany({});
  await prisma.unit.deleteMany({});
  await prisma.agent.deleteMany({});

  console.log('Database cleaned.');

  // 1. Create 6 Agents
  const agents = [];
  const agentNames = [
    'Sarah Connor',
    'John Connor',
    'Ellen Ripley',
    'James Carter',
    'Olivia Benson',
    'Marcus Aurelius'
  ];

  for (const name of agentNames) {
    const agent = await prisma.agent.create({
      data: { name }
    });
    agents.push(agent);
  }
  console.log(`Created ${agents.length} agents.`);

  // 2. Create 25 Units
  const unitsMap: Record<string, any> = {};
  const unitDefinitions = [
    // 4 Leased Units
    { number: '101', status: 'leased', rent: 1400.0, bedrooms: 1, bathrooms: 1.0 },
    { number: '102', status: 'leased', rent: 1800.0, bedrooms: 2, bathrooms: 2.0 },
    { number: '103', status: 'leased', rent: 2200.0, bedrooms: 3, bathrooms: 2.0 },
    { number: '104', status: 'leased', rent: 1350.0, bedrooms: 1, bathrooms: 1.0 },
    // 3 Held Units (to match 3 Application prospects)
    { number: '201', status: 'held', rent: 1450.0, bedrooms: 1, bathrooms: 1.0 },
    { number: '202', status: 'held', rent: 1900.0, bedrooms: 2, bathrooms: 2.0 },
    { number: '203', status: 'held', rent: 1300.0, bedrooms: 0, bathrooms: 1.0 }, // Studio
    // 18 Available Units
    { number: '105', status: 'available', rent: 1500.0, bedrooms: 1, bathrooms: 1.0 },
    { number: '204', status: 'available', rent: 1850.0, bedrooms: 2, bathrooms: 2.0 },
    { number: '205', status: 'available', rent: 2300.0, bedrooms: 3, bathrooms: 2.0 },
    { number: '301', status: 'available', rent: 1200.0, bedrooms: 0, bathrooms: 1.0 },
    { number: '302', status: 'available', rent: 1550.0, bedrooms: 1, bathrooms: 1.0 },
    { number: '303', status: 'available', rent: 1950.0, bedrooms: 2, bathrooms: 2.0 },
    { number: '304', status: 'available', rent: 2400.0, bedrooms: 3, bathrooms: 2.0 },
    { number: '305', status: 'available', rent: 1250.0, bedrooms: 0, bathrooms: 1.0 },
    { number: '401', status: 'available', rent: 1600.0, bedrooms: 1, bathrooms: 1.0 },
    { number: '402', status: 'available', rent: 2000.0, bedrooms: 2, bathrooms: 2.0 },
    { number: '403', status: 'available', rent: 2500.0, bedrooms: 3, bathrooms: 2.0 },
    { number: '404', status: 'available', rent: 1300.0, bedrooms: 0, bathrooms: 1.0 },
    { number: '405', status: 'available', rent: 1650.0, bedrooms: 1, bathrooms: 1.5 },
    { number: '501', status: 'available', rent: 2100.0, bedrooms: 2, bathrooms: 2.0 },
    { number: '502', status: 'available', rent: 2600.0, bedrooms: 3, bathrooms: 2.0 },
    { number: '503', status: 'available', rent: 1350.0, bedrooms: 0, bathrooms: 1.0 },
    { number: '504', status: 'available', rent: 1700.0, bedrooms: 1, bathrooms: 1.0 },
    { number: '505', status: 'available', rent: 2150.0, bedrooms: 2, bathrooms: 2.0 }
  ];

  for (const def of unitDefinitions) {
    const unit = await prisma.unit.create({
      data: def
    });
    unitsMap[def.number] = unit;
  }
  console.log(`Created ${unitDefinitions.length} units.`);

  // Helper to get random agent
  const getRandomAgent = () => agents[Math.floor(Math.random() * agents.length)];

  // 3. Create 16 Prospects
  const prospectDefinitions = [
    // 4 Leased Prospects (1:1 with Leased Units)
    { name: 'Alice Smith', email: 'alice.smith@example.com', phone: '555-0101', status: 'leased', assignedUnitNum: '101' },
    { name: 'Bob Johnson', email: 'bob.johnson@example.com', phone: '555-0102', status: 'leased', assignedUnitNum: '102' },
    { name: 'Charlie Brown', email: 'charlie.brown@example.com', phone: '555-0103', status: 'leased', assignedUnitNum: '103' },
    { name: 'Diana Prince', email: 'diana.prince@example.com', phone: '555-0104', status: 'leased', assignedUnitNum: '104' },

    // 3 Application Prospects (1:1 with Held Units)
    { name: 'Evan Wright', email: 'evan.wright@example.com', phone: '555-0201', status: 'application', assignedUnitNum: '201' },
    { name: 'Fiona Gallagher', email: 'fiona.g@example.com', phone: '555-0202', status: 'application', assignedUnitNum: '202' },
    { name: 'George Bluth', email: 'george.b@example.com', phone: '555-0203', status: 'application', assignedUnitNum: '203' },

    // 2 Tour Scheduled Prospects (Will have scheduled tours shortly)
    { name: 'Hannah Abbott', email: 'hannah.a@example.com', phone: '555-0301', status: 'tour_scheduled', assignedUnitNum: null },
    { name: 'Ian Malcolm', email: 'ian.m@example.com', phone: '555-0302', status: 'tour_scheduled', assignedUnitNum: null },

    // 2 New Prospects
    { name: 'Julia Roberts', email: 'julia.r@example.com', phone: '555-0401', status: 'new', assignedUnitNum: null },
    { name: 'Kevin Bacon', email: 'kevin.b@example.com', phone: '555-0402', status: 'new', assignedUnitNum: null },

    // 2 Contacted Prospects
    { name: 'Laura Croft', email: 'laura.c@example.com', phone: '555-0501', status: 'contacted', assignedUnitNum: null },
    { name: 'Michael Scott', email: 'michael.s@example.com', phone: '555-0502', status: 'contacted', assignedUnitNum: null },

    // 2 Toured Prospects
    { name: 'Natalie Portman', email: 'natalie.p@example.com', phone: '555-0601', status: 'toured', assignedUnitNum: null },
    { name: 'Oliver Twist', email: 'oliver.t@example.com', phone: '555-0602', status: 'toured', assignedUnitNum: null },

    // 1 Lost Prospect
    { name: 'Peter Parker', email: 'peter.p@example.com', phone: '555-0701', status: 'lost', assignedUnitNum: null }
  ];

  const prospectsMap: Record<string, any> = {};

  for (const def of prospectDefinitions) {
    const agent = getRandomAgent();
    const assignedUnit = def.assignedUnitNum ? unitsMap[def.assignedUnitNum] : null;

    const prospect = await prisma.prospect.create({
      data: {
        name: def.name,
        email: def.email,
        phone: def.phone,
        status: def.status,
        notes: `Automatically seeded prospect record for ${def.name}.`,
        assignedUnitId: assignedUnit ? assignedUnit.id : null,
        agentId: agent.id
      }
    });
    prospectsMap[def.name] = prospect;
  }
  console.log(`Created ${prospectDefinitions.length} prospects.`);

  // 4. Create Scheduled Tours in the Next Week or Two
  const tourDates = [
    new Date(), // 5 days out
    new Date()  // 12 days out
  ];
  tourDates[0].setDate(tourDates[0].getDate() + 5);
  tourDates[0].setHours(10, 0, 0, 0);

  tourDates[1].setDate(tourDates[1].getDate() + 12);
  tourDates[1].setHours(14, 30, 0, 0);

  // Scheduled Tour 1: Hannah Abbott touring Unit 302
  const tour1 = await prisma.tour.create({
    data: {
      prospectId: prospectsMap['Hannah Abbott'].id,
      unitId: unitsMap['302'].id,
      scheduledTime: tourDates[0],
      status: 'scheduled'
    }
  });

  // Scheduled Tour 2: Ian Malcolm touring Unit 402
  const tour2 = await prisma.tour.create({
    data: {
      prospectId: prospectsMap['Ian Malcolm'].id,
      unitId: unitsMap['402'].id,
      scheduledTime: tourDates[1],
      status: 'scheduled'
    }
  });

  // Also update prospect.tourDate to reflect scheduled tours
  await prisma.prospect.update({
    where: { id: prospectsMap['Hannah Abbott'].id },
    data: { tourDate: tourDates[0] }
  });

  await prisma.prospect.update({
    where: { id: prospectsMap['Ian Malcolm'].id },
    data: { tourDate: tourDates[1] }
  });

  console.log('Created scheduled tours for prospects.');
  console.log('Database seeding successfully prepared.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
