import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    super({ adapter });
  }

  async onModuleInit() {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Database connection timed out after 15s')), 15000),
    );
    await Promise.race([this.$connect(), timeout]);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
