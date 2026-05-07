import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { StreamChat } from 'stream-chat';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter } as any);

const PASSWORD = 'Password1!';

const users = [
  {
    firstName: 'James',
    lastName: 'Kariuki',
    username: 'james_09',
    email: 'james@bond.dev',
  },
  {
    firstName: 'Alice',
    lastName: 'Kimura',
    username: 'alice_22',
    email: 'alice@bond.dev',
  },
  {
    firstName: 'Bob',
    lastName: 'Ntwari',
    username: 'bob_47',
    email: 'bob@bond.dev',
  },
  {
    firstName: 'Clara',
    lastName: 'Osei',
    username: 'clara_08',
    email: 'clara@bond.dev',
  },
  {
    firstName: 'David',
    lastName: 'Mugisha',
    username: 'david_33',
    email: 'david@bond.dev',
  },
  {
    firstName: 'Eve',
    lastName: 'Uwitonze',
    username: 'eve_15',
    email: 'eve@bond.dev',
  },
];

async function main() {
  console.log('Seeding users...');

  const seedEmails = users.map((u) => u.email);
  const deleted = await prisma.user.deleteMany({
    where: { email: { notIn: seedEmails } },
  });
  if (deleted.count > 0)
    console.log(`  Removed ${deleted.count} stale user(s)`);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const serverClient = StreamChat.getInstance(
    process.env.STREAM_API_KEY!,
    process.env.STREAM_API_SECRET!,
  );

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        firstName: u.firstName,
        lastName: u.lastName,
        username: u.username,
        email: u.email,
        passwordHash,
        emailVerified: true,
      },
    });

    await serverClient.upsertUser({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      username: user.username,
    });

    console.log(`  ✓ ${user.username} (${user.email})`);
  }

  console.log(`\nAll users seeded. Password for all: "${PASSWORD}"`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
