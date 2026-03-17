import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';
import path from 'path';

// Prisma skips .env auto-loading when prisma.config.ts is present — load manually
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export default defineConfig({
  schema: './prisma/schema',
});
