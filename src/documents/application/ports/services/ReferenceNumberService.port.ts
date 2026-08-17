import type { RefNumPayload } from "../../types/refNum.type.js";

interface ReferenceNumberServicePort {
    generate(payload: RefNumPayload): Promise<string>
}

export type {ReferenceNumberServicePort};