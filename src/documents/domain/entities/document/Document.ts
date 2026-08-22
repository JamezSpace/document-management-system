import DomainError from "../../../../shared/errors/DomainError.error.js";
import { GlobalDomainErrors } from "../../../../shared/errors/enum/domain.enum.js";
import { DisposalAction } from "../../enum/disposalAction.enum.js";
import { LifecycleState } from "../../enum/lifecycleState.enum.js";
import type { AddresseeMetadata } from "../../metadata/Addressee.metadata.js";
import type { ClassificationMetadata } from "../../metadata/Classification.metadata.js";
import type { CorrespondenceMetadata } from "../../metadata/Correspondence.metadata.js";
import type { RetentionMetadata } from "../../metadata/Retention.metadata.js";
import DocumentVersion from "./DocumentVersion.js";

interface DocumentPayload {
	id: string;
	ownerId: string;
	title: string;
	version?: DocumentVersion | null;
	referenceNumber?: string | null;
	revision?: number;

	addressees: AddresseeMetadata[];
	classification: ClassificationMetadata;
	correspondence: CorrespondenceMetadata;
	retention: RetentionMetadata;

	createdAt?: Date;
	updatedAt?: Date | null;
}

/**
 * Represents the core Document entity in the system.
 * This is NOT a database model and NOT an API DTO.
 *
 * Responsibilities:
 * - Holds the canonical state of a document
 * - Enforces invariants (what is always true)
 * - Exposes domain-level behaviors (submit, approve, reject)
 */
class Document {
	// document identity
	readonly id: string;
	readonly ownerId: string;
	readonly title: string;
	private currentVersion: DocumentVersion | null;
	readonly referenceNumber: string | null;
	readonly revision: number;

	// Governance Domains (Value Objects)
	addressees: AddresseeMetadata[];
	classification: ClassificationMetadata;
	correspondence: CorrespondenceMetadata;
	readonly retention: RetentionMetadata;

	// Audit
	readonly createdAt: Date;
	private updatedAt: Date | null;

	constructor(payload: DocumentPayload) {
		this.id = payload.id;
		this.ownerId = payload.ownerId;
		this.title = payload.title;
		this.currentVersion = payload.version ?? null;
		this.referenceNumber = payload.referenceNumber ?? null;
		this.revision = payload.revision ?? 1;

		this.classification = payload.classification;
		this.correspondence = payload.correspondence;
		this.retention = payload.retention;

		this.createdAt = payload.createdAt ?? new Date();
		this.updatedAt = payload.updatedAt ?? null;

		const primaryCount = payload.addressees.filter(
			(a) => a.isPrimary,
		).length;

		if (primaryCount !== 1) {
			throw new DomainError(
				GlobalDomainErrors.document.INVALID_OPERATION,
				{
					details: {
						message:
							"Document must have exactly one primary addressee",
					},
				},
			);
		}

		this.addressees = payload.addressees;
	}

	getCurrentVersion(): DocumentVersion | null {
		return this.currentVersion;
	}

	getPrimaryAddressee(): AddresseeMetadata {
		const primary = this.addressees.find((a) => a.isPrimary);

		if (!primary) {
			throw new DomainError(
				GlobalDomainErrors.document.INVALID_OPERATION,
				{
					details: { message: "No primary addressee found" },
				},
			);
		}

		return primary;
	}

	public addVersion(
		payload: {
			contentDelta: unknown;
			uuid: string;
			mediaId?: string;
		},
		actorId: string,
	): DocumentVersion {
		const now = new Date();
		const versionNumber = this.currentVersion
			? this.currentVersion.versionNumber + 1
			: 1;

		const version = new DocumentVersion({
			id: "DOC-VERSION-" + payload.uuid,
			documentId: this.id,
			contentDelta: payload.contentDelta,
			versionNumber,
			mediaId: payload.mediaId ?? null,
			createdAt: now,
			createdBy: actorId,
			lifecycle: {
				currentState: LifecycleState.DRAFT,
				stateEnteredAt: now,
				stateEnteredBy: actorId,
			},
		});

		this.currentVersion = version;
		return version;
	}

	public save(
		payload: {
			contentDelta: unknown;
			uuid: string;
			mediaId?: string;
		},
		actorId: string,
	): DocumentVersion {
		if (!this.currentVersion) {
			return this.addVersion(payload, actorId);
		}

		return this.createNextVersion(
			{
				...payload,
				mediaId: payload.mediaId ?? null,
			},
			actorId,
		);
	}

	public createNextVersion(
		payload: {
			contentDelta: unknown;
			mediaId?: string | null;
			uuid: string;
		},
		actorId: string,
	): DocumentVersion {
		if (!this.currentVersion) {
			throw new DomainError(
				GlobalDomainErrors.document.INVALID_OPERATION,
				{
					details: {
						message: "Document has no version yet.",
					},
				},
			);
		}

		if (
			this.currentVersion.lifecycle.currentState ===
			LifecycleState.DECLARED_RECORD
		) {
			throw new DomainError(
				GlobalDomainErrors.document.INVALID_OPERATION,
				{
					details: {
						message: "Records cannot be versioned.",
					},
				},
			);
		}

		const now = new Date();
		const versionNumber = this.currentVersion.versionNumber + 1;

		const newVersion = new DocumentVersion({
			id: "DOC-VERS-" + payload.uuid,
			documentId: this.id,
			versionNumber,
			contentDelta: payload.contentDelta,
			mediaId: payload.mediaId ?? null,
			createdAt: now,
			createdBy: actorId,
			lifecycle: {
				currentState: LifecycleState.DRAFT,
				stateEnteredAt: now,
				stateEnteredBy: actorId,
			},
		});

		this.currentVersion = newVersion;

		return newVersion;
	}

	public reclassify(
		newClassification: ClassificationMetadata,
		actorId: string,
	) {
		if (
			this.currentVersion?.lifecycle.currentState ===
			LifecycleState.DECLARED_RECORD
		) {
			throw new Error("Records cannot be reclassified.");
		}

		this.classification = {
			...newClassification,
			lastReclassifiedBy: actorId,
			lastReclassifiedAt: new Date(),
		};

		this.updatedAt = new Date();
	}

	// retention metadata
	startRetention(startDate: Date) {
		if (this.retention.retentionStartDate) {
			throw new Error("Retention already started");
		}

		this.retention.retentionStartDate = startDate;
	}

	isEligibleForDisposition(currentDate: Date): boolean {
		return currentDate >= this.retention.disposalEligibilityDate;
	}

	getDispositionAction() {
		return this.retention.archivalRequired
			? DisposalAction.ARCHIVE
			: DisposalAction.DESTROY;
	}
}

export default Document;
