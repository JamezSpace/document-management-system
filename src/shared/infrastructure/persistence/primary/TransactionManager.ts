import type { PostgresDb } from "@fastify/postgres";
import type { TransactionContext } from "./postgres.js";

class TransactionManager {
  constructor(private readonly pool: PostgresDb) {}

  async execute<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const result = await work({ client });

      await client.query('COMMIT');

      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export default TransactionManager;