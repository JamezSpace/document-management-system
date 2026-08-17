interface RefNumPayload {
	year: number;
	originUnitId: string;
	recipientUnitId: string | null;
	subjectCode: string;
	functionCode: string;
}

export type { RefNumPayload };
