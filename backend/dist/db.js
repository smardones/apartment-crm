import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
let prismaClient;
if (process.env.TURSO_DATABASE_URL) {
    const libsql = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSQL(libsql);
    prismaClient = new PrismaClient({ adapter });
}
else {
    // Fallback to local file-based database for development
    prismaClient = new PrismaClient();
}
export const prisma = prismaClient;
