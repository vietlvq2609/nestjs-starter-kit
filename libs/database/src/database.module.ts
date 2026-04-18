import { Global, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/users.schema';

export const DRIZZLE_CLIENT = 'DRIZZLE_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_CLIENT,
      useFactory: () => {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
          throw new Error('DATABASE_URL is not defined in .env');
        }
        const client = postgres(connectionString);
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DRIZZLE_CLIENT],
})
export class DatabaseModule {}
