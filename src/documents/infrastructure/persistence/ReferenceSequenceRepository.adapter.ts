import type { PostgresDb } from "@fastify/postgres";
import { transformToCamelCase } from "../../../shared/infrastructure/persistence/primary/helpers/transformToCamelCase.helper.js";
import type { ReferenceSequenceRepositoryPort } from "../../application/ports/repos/ReferenceSequenceRepository.port.js";
import type { RefNumPayload } from "../../application/types/refNum.type.js";

class ReferenceSequenceRepositoryAdapter implements ReferenceSequenceRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async nextSequence(payload: RefNumPayload): Promise<{
		nextCount: number;
		originUnit: string;
		recipientUnit: string | null;
	}> {
		const query = `
            SELECT * FROM document.next_reference_sequence($1,$2,$3,$4,$5);
        `;

		const result = await this.dbPool.query(query, [
			payload.year,
			payload.originUnitId,
			payload.recipientUnitId,
			payload.subjectCode,
			payload.functionCode,
		]);

		return transformToCamelCase(result.rows[0]) as {
			nextCount: number;
			originUnit: string;
			recipientUnit: string | null;
		};
	}
}

export default ReferenceSequenceRepositoryAdapter;
