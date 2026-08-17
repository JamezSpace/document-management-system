import type { RetentionMetadata } from "../../../domain/metadata/Retention.metadata.js";

interface RetentionServicePort {
	computeRetention(
		documentTypeId: string,
		retentionStartDate: Date,
	): Promise<RetentionMetadata>;
}

export type { RetentionServicePort };

