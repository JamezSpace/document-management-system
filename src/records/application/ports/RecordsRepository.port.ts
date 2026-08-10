import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";
import type {
	ArchiveAccession,
	DisposalCertificate,
	DisposalRequest,
	LegalHold,
	ManagedRecord,
	RecordPlacement,
	RecordRetention,
	RecordsScope,
	RecordsTransfer,
	RetentionSchedule,
	RetentionScheduleVersion,
	StorageLocation,
} from "../../domain/records.models.js";

interface RecordsScopeFilter {
	organization: boolean;
	unitIds: string[];
	officeIds: string[];
}

interface RecordsRepositoryPort {
	createDeclaredRecord(
		record: ManagedRecord,
		tx: TransactionContext,
	): Promise<ManagedRecord>;
	findRecordById(
		id: string,
		tx?: TransactionContext,
		forUpdate?: boolean,
	): Promise<ManagedRecord | null>;
	listRecords(scope: RecordsScopeFilter): Promise<ManagedRecord[]>;
	updateRecordStatus(
		id: string,
		status: ManagedRecord["status"],
		expectedVersion: number,
		tx: TransactionContext,
	): Promise<ManagedRecord>;
	touchRecord(
		id: string,
		expectedVersion: number,
		tx: TransactionContext,
	): Promise<ManagedRecord>;

	createStorageLocation(
		location: StorageLocation,
		tx: TransactionContext,
	): Promise<StorageLocation>;
	findStorageLocationById(
		id: string,
		tx?: TransactionContext,
		forUpdate?: boolean,
	): Promise<StorageLocation | null>;
	listStorageLocations(scope: RecordsScopeFilter): Promise<StorageLocation[]>;
	appendPlacement(
		placement: RecordPlacement,
		tx: TransactionContext,
	): Promise<RecordPlacement>;
	findCurrentPlacement(
		recordId: string,
		tx?: TransactionContext,
	): Promise<RecordPlacement | null>;

	createRetentionSchedule(
		schedule: RetentionSchedule,
		tx: TransactionContext,
	): Promise<RetentionSchedule>;
	findRetentionScheduleById(
		id: string,
		tx?: TransactionContext,
		forUpdate?: boolean,
	): Promise<RetentionSchedule | null>;
	listRetentionSchedules(scope: RecordsScopeFilter): Promise<RetentionSchedule[]>;
	createRetentionScheduleVersion(
		version: RetentionScheduleVersion,
		expectedScheduleVersion: number,
		tx: TransactionContext,
	): Promise<RetentionScheduleVersion>;
	findRetentionScheduleVersionById(
		id: string,
		tx?: TransactionContext,
	): Promise<RetentionScheduleVersion | null>;
	applyRetention(
		application: RecordRetention,
		expectedRecordVersion: number,
		tx: TransactionContext,
	): Promise<RecordRetention>;
	findCurrentRetention(
		recordId: string,
		tx?: TransactionContext,
	): Promise<RecordRetention | null>;

	createLegalHold(hold: LegalHold, tx: TransactionContext): Promise<LegalHold>;
	findLegalHoldById(
		id: string,
		tx?: TransactionContext,
		forUpdate?: boolean,
	): Promise<LegalHold | null>;
	addRecordToLegalHold(
		input: {
			id: string;
			holdId: string;
			recordId: string;
			addedBy: string;
			addedAt: Date;
		},
		expectedHoldVersion: number,
		tx: TransactionContext,
	): Promise<void>;
	releaseLegalHold(
		input: {
			holdId: string;
			releasedBy: string;
			releasedAt: Date;
			reason: string;
		},
		expectedVersion: number,
		tx: TransactionContext,
	): Promise<LegalHold>;
	hasActiveLegalHold(recordId: string, tx?: TransactionContext): Promise<boolean>;

	createTransfer(
		transfer: RecordsTransfer,
		items: Array<{ id: string; recordId: string }>,
		tx: TransactionContext,
	): Promise<RecordsTransfer>;
	findTransferById(
		id: string,
		tx?: TransactionContext,
		forUpdate?: boolean,
	): Promise<RecordsTransfer | null>;
	approveTransfer(
		id: string,
		approvedBy: string,
		expectedVersion: number,
		tx: TransactionContext,
	): Promise<RecordsTransfer>;
	completeTransfer(
		id: string,
		completedBy: string,
		expectedVersion: number,
		tx: TransactionContext,
	): Promise<RecordsTransfer>;
	createArchiveAccession(
		accession: ArchiveAccession,
		tx: TransactionContext,
	): Promise<ArchiveAccession>;

	createDisposalRequest(
		request: DisposalRequest,
		items: Array<{ id: string; recordId: string }>,
		tx: TransactionContext,
	): Promise<DisposalRequest>;
	findDisposalRequestById(
		id: string,
		tx?: TransactionContext,
		forUpdate?: boolean,
	): Promise<DisposalRequest | null>;
	approveDisposalRequest(
		input: {
			id: string;
			approvalId: string;
			approvedBy: string;
			decisionAt: Date;
			notes: string | null;
		},
		expectedVersion: number,
		tx: TransactionContext,
	): Promise<DisposalRequest>;
	executeDisposalRequest(
		id: string,
		executedBy: string,
		expectedVersion: number,
		tx: TransactionContext,
	): Promise<DisposalRequest>;
	createDisposalCertificate(
		certificate: DisposalCertificate,
		tx: TransactionContext,
	): Promise<DisposalCertificate>;
	findRecordsScope(recordIds: string[], tx: TransactionContext): Promise<RecordsScope[]>;
}

export type { RecordsRepositoryPort, RecordsScopeFilter };
