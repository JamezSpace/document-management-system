import type { RefNumPayload } from "../../types/refNum.type.js";

interface ReferenceSequenceRepositoryPort {
    nextSequence(payload: RefNumPayload): Promise<{
        nextCount: number;
        originUnit: string;
        recipientUnit: string | null;
    }>;
}

export type { ReferenceSequenceRepositoryPort };

