interface NexusErrorContext {
     message: string;
     details?: Record<string, unknown>;
     cause?: unknown;
}

export type { NexusErrorContext };