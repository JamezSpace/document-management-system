import type { StatusCodes } from "http-status-codes";

interface NexusAppError {
    httpStatusCode: StatusCodes

    errorCode: string;

    errorMessage?: string;

    details?: Record<string, any>;
}

export type { NexusAppError };
