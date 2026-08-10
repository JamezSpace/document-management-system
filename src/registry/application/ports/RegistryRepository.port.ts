import type { TransactionContext } from "../../../shared/infrastructure/persistence/primary/postgres.js";
import type {
	CustodyMovement,
	DigitizationJob,
	ReferenceSeries,
	RegistryEntry,
	RegistryIntake,
} from "../../domain/registry.models.js";

interface RegistryScopeFilter {
	organization: boolean;
	unitIds: string[];
	officeIds: string[];
}

interface NewScanPage {
	id: string;
	jobId: string;
	pageNumber: number;
	mediaAssetId: string;
	checksum: string;
	scannedBy: string;
}

interface RegistryRepositoryPort {
	createIntake(intake: RegistryIntake, tx?: TransactionContext): Promise<RegistryIntake>;
	findIntakeById(id: string, tx?: TransactionContext, forUpdate?: boolean): Promise<RegistryIntake | null>;
	listIntakes(scope: RegistryScopeFilter): Promise<RegistryIntake[]>;
	updateIntake(intake: RegistryIntake, expectedVersion: number, tx: TransactionContext): Promise<RegistryIntake>;
	createDigitizationJob(job: DigitizationJob, tx: TransactionContext): Promise<DigitizationJob>;
	findDigitizationJobById(id: string, tx?: TransactionContext, forUpdate?: boolean): Promise<DigitizationJob | null>;
	addScanPage(page: NewScanPage, tx: TransactionContext): Promise<void>;
	countScanPages(jobId: string, tx: TransactionContext): Promise<number>;
	addOcrRun(input: { id: string; jobId: string; provider: string; extractedText: string; confidence: number | null; createdBy: string }, tx: TransactionContext): Promise<void>;
	updateDigitizationJob(job: DigitizationJob, expectedVersion: number, tx: TransactionContext): Promise<DigitizationJob>;
	allocateReference(input: { id: string; seriesId: string; officeId: string; year: number; allocatedBy: string }, tx: TransactionContext): Promise<string>;
	createEntry(entry: RegistryEntry, tx: TransactionContext): Promise<RegistryEntry>;
	findEntryById(id: string, tx?: TransactionContext, forUpdate?: boolean): Promise<RegistryEntry | null>;
	listEntries(scope: RegistryScopeFilter): Promise<RegistryEntry[]>;
	updateEntry(entry: RegistryEntry, expectedVersion: number, tx: TransactionContext): Promise<RegistryEntry>;
	createDispatch(input: { id: string; registryEntryId: string; recipientType: string; recipientId: string | null; externalRecipient: Record<string, unknown> | null; deliveryChannel: string; trackingNumber: string | null; acknowledgementRequired: boolean; createdBy: string }, tx: TransactionContext): Promise<void>;
	createMovement(movement: CustodyMovement, tx: TransactionContext): Promise<CustodyMovement>;
	findMovementById(id: string, tx?: TransactionContext, forUpdate?: boolean): Promise<CustodyMovement | null>;
	updateMovement(movement: CustodyMovement, expectedVersion: number, tx: TransactionContext): Promise<CustodyMovement>;
	appendCorrespondence(input: { id: string; entryId: string; direction: "incoming" | "outgoing"; channel: string; counterparty: string; trackingNumber: string | null; actorId: string; officeId: string; unitId: string }, tx: TransactionContext): Promise<void>;
	listCorrespondence(scope: RegistryScopeFilter): Promise<Record<string, unknown>[]>;
	listReferenceSeries(scope: RegistryScopeFilter): Promise<ReferenceSeries[]>;
	createReferenceSeries(series: ReferenceSeries): Promise<ReferenceSeries>;
}

export type { NewScanPage, RegistryRepositoryPort, RegistryScopeFilter };
