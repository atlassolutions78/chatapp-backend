"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const bcrypt = __importStar(require("bcrypt"));
const stream_chat_1 = require("stream-chat");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});
const prisma = new client_1.PrismaClient({ adapter });
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
    const serverClient = stream_chat_1.StreamChat.getInstance(process.env.STREAM_API_KEY, process.env.STREAM_API_SECRET);
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
//# sourceMappingURL=seed.js.map