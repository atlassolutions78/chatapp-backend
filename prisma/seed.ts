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
  { firstName: 'Alpha', lastName: 'Bravo', username: 'alpha_bravo' },
  { firstName: 'Charlie', lastName: 'Delta', username: 'charlie_delta' },
  { firstName: 'Echo', lastName: 'Foxtrot', username: 'echo_foxtrot' },
  { firstName: 'Golf', lastName: 'Hotel', username: 'golf_hotel' },
  { firstName: 'India', lastName: 'Juliet', username: 'india_juliet' },
  { firstName: 'Kilo', lastName: 'Lima', username: 'kilo_lima' },
  { firstName: 'Mike', lastName: 'November', username: 'mike_november' },
  { firstName: 'Oscar', lastName: 'Papa', username: 'oscar_papa' },
];

async function main() {
  console.log('Seeding users...');

  const seedUsernames = users.map((u) => u.username);
  const staleUsers = await prisma.user.findMany({
    where: { username: { notIn: seedUsernames } },
    select: { id: true },
  });
  const staleIds = staleUsers.map((u) => u.id);
  if (staleIds.length > 0) {
    await prisma.callHistory.deleteMany({ where: { callerId: { in: staleIds } } });
    const deleted = await prisma.user.deleteMany({ where: { id: { in: staleIds } } });
    console.log(`  Removed ${deleted.count} stale user(s)`);
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const serverClient = StreamChat.getInstance(
    process.env.STREAM_API_KEY!,
    process.env.STREAM_API_SECRET!,
  );

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        firstName: u.firstName,
        lastName: u.lastName,
        username: u.username,
        passwordHash,
      },
    });

    await serverClient.upsertUser({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      username: user.username,
    });

    console.log(`  ✓ ${user.username}`);
  }

  console.log(`\nAll users seeded. Password for all: "${PASSWORD}"`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
