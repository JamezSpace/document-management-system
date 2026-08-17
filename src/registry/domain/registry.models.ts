type IntakeStatus =
	| "received"
	| "awaiting_digitization"
	| "awaiting_verification"
	| "ready_for_registration"
	| "awaiting_dispatch"
	| "dispatched";

type DigitizationStatus = "pending" | "scanning" | "awaiting_verification" | "verified";
type RegistryEntryStatus = "awaiting_dispatch" | "dispatched" | "closed";
type CustodyMovementStatus = "in_transit" | "received";

interface RegistryIntake {
	id: string;
	sourceType: "physical" | "digital" | "email" | "courier";
	senderName: string;
	subject: string;
	receivedAt: Date;
	requiresDigitization: boolean;
	status: IntakeStatus;
	officeId: string;
	unitId: string;
	createdBy: string;
	version: number;
	createdAt: Date;
	updatedAt: Date;
}

interface DigitizationJob {
	id: string;
	intakeId: string;
	status: DigitizationStatus;
	createdBy: string;
	verifiedBy: string | null;
	verifiedAt: Date | null;
	version: number;
	createdAt: Date;
}

interface RegistryEntry {
	id: string;
	intakeId: string;
	documentId: string | null;
	referenceNumber: string;
	status: RegistryEntryStatus;
	officeId: string;
	unitId: string;
	registeredBy: string;
	version: number;
	registeredAt: Date;
}

interface CustodyMovement {
	id: string;
	entryId: string;
	fromStaffId: string;
	toStaffId: string | null;
	toOfficeId: string;
	status: CustodyMovementStatus;
	initiatedBy: string;
	receivedBy: string | null;
	startedAt: Date;
	receivedAt: Date | null;
	version: number;
}

interface ReferenceSeries {
	id: string;
	code: string;
	name: string;
	officeId: string;
	unitId: string;
	prefix: string;
	active: boolean;
	version: number;
}

export type {
	CustodyMovement,
	CustodyMovementStatus,
	DigitizationJob,
	DigitizationStatus,
	IntakeStatus,
	ReferenceSeries,
	RegistryEntry,
	RegistryEntryStatus,
	RegistryIntake,
};
