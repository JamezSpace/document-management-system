type RecordStatus =
	| "active"
	| "pending_transfer"
	| "archived"
	| "pending_disposal"
	| "disposed";

type StorageLocationType =
	| "room"
	| "cabinet"
	| "shelf"
	| "box"
	| "offsite";

type LegalHoldStatus = "active" | "released";
type TransferStatus = "requested" | "approved" | "completed" | "cancelled";
type DisposalRequestStatus = "requested" | "approved" | "executed" | "rejected";
type RetentionTrigger =
	| "declaration"
	| "case_closed"
	| "contract_ended"
	| "superseded"
	| "manual";
type DispositionAction = "review" | "archive" | "dispose";

interface RecordsScope {
	unitId: string | null;
	officeId: string | null;
}

interface ManagedRecord extends RecordsScope {
	id: string;
	title: string;
	documentId: string;
	documentVersionId: string;
	contentChecksum: string;
	status: RecordStatus;
	currentRetentionId: string | null;
	declaredBy: string;
	declaredAt: Date;
	version: number;
	createdAt: Date;
	updatedAt: Date | null;
}

interface StorageLocation extends RecordsScope {
	id: string;
	parentId: string | null;
	type: StorageLocationType;
	code: string;
	name: string;
	active: boolean;
	version: number;
	createdBy: string;
	createdAt: Date;
}

interface RecordPlacement {
	id: string;
	recordId: string;
	locationId: string;
	eventType: "placed" | "removed";
	relatedPlacementId: string | null;
	performedBy: string;
	performedAt: Date;
	notes: string | null;
}

interface RetentionSchedule extends RecordsScope {
	id: string;
	code: string;
	name: string;
	description: string | null;
	active: boolean;
	createdBy: string;
	createdAt: Date;
	version: number;
}

interface RetentionScheduleVersion {
	id: string;
	scheduleId: string;
	versionNumber: number;
	documentTypeId: string | null;
	durationMonths: number;
	triggerEvent: RetentionTrigger;
	dispositionAction: DispositionAction;
	effectiveFrom: Date;
	effectiveTo: Date | null;
	approvedBy: string;
	createdAt: Date;
}

interface RecordRetention {
	id: string;
	recordId: string;
	scheduleVersionId: string;
	triggerDate: Date;
	eligibilityDate: Date;
	appliedBy: string;
	appliedAt: Date;
	supersedesId: string | null;
}

interface LegalHold extends RecordsScope {
	id: string;
	title: string;
	reason: string;
	status: LegalHoldStatus;
	placedBy: string;
	placedAt: Date;
	releasedBy: string | null;
	releasedAt: Date | null;
	releaseReason: string | null;
	version: number;
}

interface RecordsTransfer extends RecordsScope {
	id: string;
	destinationOfficeId: string | null;
	destinationUnitId: string | null;
	destinationLocationId: string | null;
	reason: string;
	status: TransferStatus;
	requestedBy: string;
	requestedAt: Date;
	approvedBy: string | null;
	approvedAt: Date | null;
	completedBy: string | null;
	completedAt: Date | null;
	version: number;
	recordIds: string[];
}

interface ArchiveAccession extends RecordsScope {
	id: string;
	transferId: string;
	accessionNumber: string;
	destinationLocationId: string | null;
	accessionedBy: string;
	accessionedAt: Date;
	notes: string | null;
}

interface DisposalRequest extends RecordsScope {
	id: string;
	reason: string;
	status: DisposalRequestStatus;
	requestedBy: string;
	requestedAt: Date;
	executedBy: string | null;
	executedAt: Date | null;
	version: number;
	recordIds: string[];
	approvalActorIds: string[];
}

interface DisposalCertificate {
	id: string;
	disposalRequestId: string;
	certificateNumber: string;
	method: string;
	evidence: Record<string, unknown>;
	issuedBy: string;
	issuedAt: Date;
}

export type {
	ArchiveAccession,
	DisposalCertificate,
	DisposalRequest,
	DisposalRequestStatus,
	DispositionAction,
	LegalHold,
	LegalHoldStatus,
	ManagedRecord,
	RecordPlacement,
	RecordRetention,
	RecordsScope,
	RecordsTransfer,
	RecordStatus,
	RetentionSchedule,
	RetentionScheduleVersion,
	RetentionTrigger,
	StorageLocation,
	StorageLocationType,
	TransferStatus,
};
