import type { IdGeneratorPort } from "../../shared/application/port/services/IdGenerator.port.js";
import type { TransactionManager } from "../../shared/application/port/TransactionManager.port.js";
import ApplicationError from "../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../shared/errors/enum/application.enum.js";
import AuthorizationService from "../../security/application/AuthorizationService.js";
import type { ActorContext } from "../../security/application/authorization.types.js";
import type {
	CustodyMovement,
	DigitizationJob,
	ReferenceSeries,
	RegistryEntry,
	RegistryIntake,
} from "../domain/registry.models.js";
import { RegistryCapabilities } from "../domain/registry.capabilities.js";
import type { RegistryAuditPort } from "./ports/RegistryAudit.port.js";
import type { RegistryRepositoryPort, RegistryScopeFilter } from "./ports/RegistryRepository.port.js";
import RegistryPolicyEvaluator from "./RegistryPolicyEvaluator.js";

interface RequestEvidence {
	requestId?: string;
	correlationId?: string;
}

class RegistryService {
	constructor(
		private readonly repository: RegistryRepositoryPort,
		private readonly audit: RegistryAuditPort,
		private readonly transactions: TransactionManager,
		private readonly ids: IdGeneratorPort,
		private readonly policy = new RegistryPolicyEvaluator(),
		private readonly authorization = new AuthorizationService(),
	) {}

	async createIntake(
		actor: ActorContext,
		input: {
			sourceType: RegistryIntake["sourceType"];
			senderName: string;
			subject: string;
			receivedAt: Date;
			requiresDigitization: boolean;
		},
	): Promise<RegistryIntake & { allowedActions: string[] }> {
		const scope = this.actorHomeScope(actor);
		this.assertScopedCapability(actor, RegistryCapabilities.INTAKE_CREATE, scope);
		const now = new Date();
		const intake: RegistryIntake = {
			id: this.ids.generate(),
			...input,
			status: "received",
			officeId: scope.officeId,
			unitId: scope.unitId,
			createdBy: actor.staffId,
			version: 1,
			createdAt: now,
			updatedAt: now,
		};
		const saved = await this.repository.createIntake(intake);
		return this.withIntakeActions(actor, saved);
	}

	async listIntakes(actor: ActorContext): Promise<Array<RegistryIntake & { allowedActions: string[] }>> {
		const rows = await this.repository.listIntakes(this.scopeFilter(actor, RegistryCapabilities.INTAKE_VIEW));
		return rows.map((row) => this.withIntakeActions(actor, row));
	}

	async getIntake(actor: ActorContext, id: string): Promise<RegistryIntake & { allowedActions: string[] }> {
		const intake = await this.requireIntake(id);
		this.policy.assertAllowed(actor, RegistryCapabilities.INTAKE_VIEW, { kind: "intake", value: intake });
		return this.withIntakeActions(actor, intake);
	}

	async updateIntake(
		actor: ActorContext,
		id: string,
		input: { senderName?: string; subject?: string; expectedVersion: number },
	): Promise<RegistryIntake & { allowedActions: string[] }> {
		const updated = await this.transactions.execute(async (tx) => {
			const current = await this.requireIntake(id, tx, true);
			this.policy.assertAllowed(actor, RegistryCapabilities.INTAKE_UPDATE, { kind: "intake", value: current });
			this.assertVersion(current.version, input.expectedVersion);
			return this.repository.updateIntake(
				{
					...current,
					senderName: input.senderName ?? current.senderName,
					subject: input.subject ?? current.subject,
					version: current.version + 1,
					updatedAt: new Date(),
				},
				input.expectedVersion,
				tx,
			);
		});
		return this.withIntakeActions(actor, updated);
	}

	async processIntake(actor: ActorContext, id: string, expectedVersion: number) {
		const updated = await this.transactions.execute(async (tx) => {
			const current = await this.requireIntake(id, tx, true);
			this.policy.assertAllowed(actor, RegistryCapabilities.INTAKE_PROCESS, { kind: "intake", value: current });
			this.assertVersion(current.version, expectedVersion);
			return this.repository.updateIntake(
				{
					...current,
					status: current.requiresDigitization ? "awaiting_digitization" : "ready_for_registration",
					version: current.version + 1,
					updatedAt: new Date(),
				},
				expectedVersion,
				tx,
			);
		});
		return this.withIntakeActions(actor, updated);
	}

	async createDigitizationJob(actor: ActorContext, intakeId: string, expectedVersion: number) {
		return this.transactions.execute(async (tx) => {
			const intake = await this.requireIntake(intakeId, tx, true);
			this.assertScopedCapability(actor, RegistryCapabilities.DIGITIZATION_PROCESS, intake);
			this.assertVersion(intake.version, expectedVersion);
			if (intake.status !== "awaiting_digitization") this.stateConflict("Intake is not awaiting digitization");
			const job: DigitizationJob = {
				id: this.ids.generate(),
				intakeId,
				status: "pending",
				createdBy: actor.staffId,
				verifiedBy: null,
				verifiedAt: null,
				version: 1,
				createdAt: new Date(),
			};
			return this.repository.createDigitizationJob(job, tx);
		});
	}

	async addScanPage(
		actor: ActorContext,
		jobId: string,
		input: { pageNumber: number; mediaAssetId: string; checksum: string; expectedVersion: number },
	) {
		return this.transactions.execute(async (tx) => {
			const job = await this.requireJob(jobId, tx, true);
			const intake = await this.requireIntake(job.intakeId, tx, true);
			this.assertScopedCapability(actor, RegistryCapabilities.DIGITIZATION_PROCESS, intake);
			this.assertVersion(job.version, input.expectedVersion);
			if (!["pending", "scanning", "awaiting_verification"].includes(job.status)) {
				this.stateConflict("Verified digitization jobs cannot be changed");
			}
			await this.repository.addScanPage(
				{ id: this.ids.generate(), jobId, ...input, scannedBy: actor.staffId },
				tx,
			);
			return this.repository.updateDigitizationJob(
				{ ...job, status: "awaiting_verification", version: job.version + 1 },
				input.expectedVersion,
				tx,
			);
		});
	}

	async addOcrRun(
		actor: ActorContext,
		jobId: string,
		input: { provider: string; extractedText: string; confidence: number | null },
	) {
		return this.transactions.execute(async (tx) => {
			const job = await this.requireJob(jobId, tx, true);
			const intake = await this.requireIntake(job.intakeId, tx);
			this.assertScopedCapability(actor, RegistryCapabilities.DIGITIZATION_PROCESS, intake);
			if (job.status === "verified") this.stateConflict("Verified digitization jobs cannot be changed");
			await this.repository.addOcrRun(
				{ id: this.ids.generate(), jobId, ...input, createdBy: actor.staffId },
				tx,
			);
			return { id: jobId, accepted: true };
		});
	}

	async verifyDigitizationJob(
		actor: ActorContext,
		jobId: string,
		expectedVersion: number,
		evidence: RequestEvidence,
	) {
		return this.transactions.execute(async (tx) => {
			const job = await this.requireJob(jobId, tx, true);
			const intake = await this.requireIntake(job.intakeId, tx, true);
			this.policy.assertAllowed(actor, RegistryCapabilities.DIGITIZATION_VERIFY, { kind: "digitization", value: job, intake });
			this.assertVersion(job.version, expectedVersion);
			if ((await this.repository.countScanPages(jobId, tx)) === 0) this.stateConflict("A job with no scan pages cannot be verified");
			const now = new Date();
			const verified = await this.repository.updateDigitizationJob(
				{ ...job, status: "verified", verifiedBy: actor.staffId, verifiedAt: now, version: job.version + 1 },
				expectedVersion,
				tx,
			);
			await this.repository.updateIntake(
				{ ...intake, status: "ready_for_registration", version: intake.version + 1, updatedAt: now },
				intake.version,
				tx,
			);
			await this.audit.append({
				id: this.ids.generate(), actorId: actor.staffId, actorType: "staff",
				capability: RegistryCapabilities.DIGITIZATION_VERIFY, action: "verify_scan",
				eventType: "registry.scan.verified", aggregateType: "registry.digitization_job",
				aggregateId: job.id, officeId: intake.officeId, unitId: intake.unitId,
				outcome: "success", requestId: evidence.requestId ?? null,
				correlationId: evidence.correlationId ?? null,
				metadata: { intakeId: intake.id },
			}, tx);
			return verified;
		});
	}

	async registerIntake(
		actor: ActorContext,
		intakeId: string,
		input: { seriesId: string; documentId: string | null; expectedVersion: number },
		evidence: RequestEvidence,
	) {
		const result = await this.transactions.execute(async (tx) => {
			const intake = await this.requireIntake(intakeId, tx, true);
			this.policy.assertAllowed(actor, RegistryCapabilities.REGISTRATION_CREATE, { kind: "intake", value: intake });
			this.assertVersion(intake.version, input.expectedVersion);
			const allocationId = this.ids.generate();
			const referenceNumber = await this.repository.allocateReference(
				{ id: allocationId, seriesId: input.seriesId, officeId: intake.officeId, year: new Date().getUTCFullYear(), allocatedBy: actor.staffId },
				tx,
			);
			const entry: RegistryEntry = {
				id: this.ids.generate(), intakeId, documentId: input.documentId,
				referenceNumber, status: "awaiting_dispatch", officeId: intake.officeId,
				unitId: intake.unitId, registeredBy: actor.staffId, version: 1, registeredAt: new Date(),
			};
			const saved = await this.repository.createEntry(entry, tx);
			await this.repository.updateIntake(
				{ ...intake, status: "awaiting_dispatch", version: intake.version + 1, updatedAt: new Date() },
				input.expectedVersion, tx,
			);
			await this.audit.append({
				id: this.ids.generate(), actorId: actor.staffId, actorType: "staff",
				capability: RegistryCapabilities.REGISTRATION_CREATE, action: "register",
				eventType: "registry.intake.registered", aggregateType: "registry.intake",
				aggregateId: intake.id, officeId: intake.officeId, unitId: intake.unitId,
				outcome: "success", requestId: evidence.requestId ?? null,
				correlationId: evidence.correlationId ?? null,
				metadata: { entryId: saved.id, referenceNumber },
			}, tx);
			return saved;
		});
		return this.withEntryActions(actor, result);
	}

	async listEntries(actor: ActorContext) {
		const entries = await this.repository.listEntries(this.scopeFilter(actor, RegistryCapabilities.ENTRY_VIEW));
		return entries.map((entry) => this.withEntryActions(actor, entry));
	}

	async getEntry(actor: ActorContext, id: string) {
		const entry = await this.requireEntry(id);
		if (!this.policy.allowedActions(actor, { kind: "entry", value: entry }).some((a) => a.endsWith(".view"))) {
			throw new ApplicationError(ApplicationErrorEnum.USER_NOT_AUTHORIZED, { message: "Registry entry is outside the actor's authority" });
		}
		return this.withEntryActions(actor, entry);
	}

	async dispatchEntry(
		actor: ActorContext,
		entryId: string,
		input: { recipientType: string; recipientId: string | null; externalRecipient: Record<string, unknown> | null; deliveryChannel: string; trackingNumber: string | null; acknowledgementRequired: boolean; expectedVersion: number },
		evidence: RequestEvidence,
	) {
		return this.transactions.execute(async (tx) => {
			const entry = await this.requireEntry(entryId, tx, true);
			this.policy.assertAllowed(actor, RegistryCapabilities.DISPATCH_CREATE, { kind: "entry", value: entry });
			this.assertVersion(entry.version, input.expectedVersion);
			const dispatchId = this.ids.generate();
			await this.repository.createDispatch({ id: dispatchId, registryEntryId: entry.id, ...input, createdBy: actor.staffId }, tx);
			const updated = await this.repository.updateEntry(
				{ ...entry, status: "dispatched", version: entry.version + 1 },
				input.expectedVersion, tx,
			);
			const intake = await this.requireIntake(entry.intakeId, tx, true);
			await this.repository.updateIntake(
				{ ...intake, status: "dispatched", version: intake.version + 1, updatedAt: new Date() },
				intake.version, tx,
			);
			await this.repository.appendCorrespondence({
				id: this.ids.generate(), entryId, direction: "outgoing", channel: input.deliveryChannel,
				counterparty: input.recipientId ?? String(input.externalRecipient?.["name"] ?? "external"),
				trackingNumber: input.trackingNumber, actorId: actor.staffId,
				officeId: entry.officeId, unitId: entry.unitId,
			}, tx);
			await this.audit.append({
				id: this.ids.generate(), actorId: actor.staffId, actorType: "staff",
				capability: RegistryCapabilities.DISPATCH_CREATE, action: "dispatch",
				eventType: "registry.entry.dispatched", aggregateType: "registry.entry",
				aggregateId: entry.id, officeId: entry.officeId, unitId: entry.unitId,
				outcome: "success", requestId: evidence.requestId ?? null,
				correlationId: evidence.correlationId ?? null, metadata: { dispatchId },
			}, tx);
			return { ...updated, dispatchId, allowedActions: this.policy.allowedActions(actor, { kind: "entry", value: updated }) };
		});
	}

	async startMovement(
		actor: ActorContext,
		entryId: string,
		input: { toStaffId: string | null; toOfficeId: string; expectedVersion: number },
		evidence: RequestEvidence,
	) {
		return this.transactions.execute(async (tx) => {
			const entry = await this.requireEntry(entryId, tx, true);
			this.policy.assertAllowed(actor, RegistryCapabilities.MOVEMENT_CREATE, { kind: "entry", value: entry });
			this.assertVersion(entry.version, input.expectedVersion);
			const movement: CustodyMovement = {
				id: this.ids.generate(), entryId, fromStaffId: actor.staffId,
				toStaffId: input.toStaffId, toOfficeId: input.toOfficeId,
				status: "in_transit", initiatedBy: actor.staffId, receivedBy: null,
				startedAt: new Date(), receivedAt: null, version: 1,
			};
			const saved = await this.repository.createMovement(movement, tx);
			await this.audit.append({
				id: this.ids.generate(), actorId: actor.staffId, actorType: "staff",
				capability: RegistryCapabilities.MOVEMENT_CREATE, action: "start_movement",
				eventType: "registry.custody.movement_started", aggregateType: "registry.custody_movement",
				aggregateId: saved.id, officeId: entry.officeId, unitId: entry.unitId,
				outcome: "success", requestId: evidence.requestId ?? null,
				correlationId: evidence.correlationId ?? null, metadata: { entryId },
			}, tx);
			return saved;
		});
	}

	async receiveMovement(actor: ActorContext, movementId: string, expectedVersion: number, evidence: RequestEvidence) {
		return this.transactions.execute(async (tx) => {
			const movement = await this.requireMovement(movementId, tx, true);
			const entry = await this.requireEntry(movement.entryId, tx);
			this.assertScopedCapability(actor, RegistryCapabilities.MOVEMENT_RECEIVE, entry);
			this.assertVersion(movement.version, expectedVersion);
			if (movement.status !== "in_transit") this.stateConflict("Movement has already been received");
			if (movement.toStaffId ? movement.toStaffId !== actor.staffId : movement.toOfficeId !== actor.officeId) {
				throw new ApplicationError(ApplicationErrorEnum.USER_NOT_AUTHORIZED, { message: "Only the intended custodian may receive this movement" });
			}
			const received = await this.repository.updateMovement(
				{ ...movement, status: "received", receivedBy: actor.staffId, receivedAt: new Date(), version: movement.version + 1 },
				expectedVersion, tx,
			);
			await this.audit.append({
				id: this.ids.generate(), actorId: actor.staffId, actorType: "staff",
				capability: RegistryCapabilities.MOVEMENT_RECEIVE, action: "receive_movement",
				eventType: "registry.custody.movement_received", aggregateType: "registry.custody_movement",
				aggregateId: received.id, officeId: entry.officeId, unitId: entry.unitId,
				outcome: "success", requestId: evidence.requestId ?? null,
				correlationId: evidence.correlationId ?? null, metadata: { entryId: entry.id },
			}, tx);
			return received;
		});
	}

	async listCorrespondence(actor: ActorContext) {
		return this.repository.listCorrespondence(this.scopeFilter(actor, RegistryCapabilities.CORRESPONDENCE_VIEW));
	}

	async listReferenceSeries(actor: ActorContext) {
		return this.repository.listReferenceSeries(this.scopeFilter(actor, RegistryCapabilities.REFERENCE_SERIES_VIEW));
	}

	async createReferenceSeries(actor: ActorContext, input: { code: string; name: string; prefix: string }) {
		const scope = this.actorHomeScope(actor);
		this.assertScopedCapability(actor, RegistryCapabilities.REFERENCE_SERIES_MANAGE, scope);
		const series: ReferenceSeries = {
			id: this.ids.generate(), ...input, officeId: scope.officeId, unitId: scope.unitId,
			active: true, version: 1,
		};
		return this.repository.createReferenceSeries(series);
	}

	private withIntakeActions(actor: ActorContext, intake: RegistryIntake) {
		return { ...intake, allowedActions: this.policy.allowedActions(actor, { kind: "intake", value: intake }) };
	}

	private withEntryActions(actor: ActorContext, entry: RegistryEntry) {
		return { ...entry, allowedActions: this.policy.allowedActions(actor, { kind: "entry", value: entry }) };
	}

	private scopeFilter(actor: ActorContext, capability: string): RegistryScopeFilter {
		const grants = actor.grants.filter((grant) => grant.capability === capability);
		return {
			organization: grants.some((grant) => grant.scope.type === "organization"),
			unitIds: [
				...new Set(
					grants.flatMap((grant) =>
						grant.scope.type === "unit" ? [grant.scope.id] : [],
					),
				),
			],
			officeIds: [
				...new Set(
					grants.flatMap((grant) =>
						grant.scope.type === "office" ? [grant.scope.id] : [],
					),
				),
			],
		};
	}

	private actorHomeScope(actor: ActorContext): { officeId: string; unitId: string } {
		if (!actor.officeId || !actor.unitId) {
			throw new ApplicationError(ApplicationErrorEnum.USER_NOT_AUTHORIZED, { message: "Registry work requires an office and unit assignment" });
		}
		return { officeId: actor.officeId, unitId: actor.unitId };
	}

	private assertScopedCapability(actor: ActorContext, capability: string, resource: { officeId: string; unitId: string }): void {
		if (!this.authorization.hasCapability(actor, capability, resource)) {
			throw new ApplicationError(ApplicationErrorEnum.USER_NOT_AUTHORIZED, { message: `Missing ${capability} in this scope` });
		}
	}

	private assertVersion(actual: number, expected: number): void {
		if (actual !== expected) this.stateConflict(`Expected version ${expected}, found ${actual}`);
	}

	private stateConflict(message: string): never {
		throw new ApplicationError(ApplicationErrorEnum.CONFLICT, { message });
	}

	private async requireIntake(id: string, tx?: Parameters<RegistryRepositoryPort["findIntakeById"]>[1], lock = false) {
		const value = await this.repository.findIntakeById(id, tx, lock);
		if (!value) throw new ApplicationError(ApplicationErrorEnum.REGISTRY_RESOURCE_NOT_FOUND, { message: `Registry intake ${id} was not found` });
		return value;
	}

	private async requireJob(id: string, tx?: Parameters<RegistryRepositoryPort["findDigitizationJobById"]>[1], lock = false) {
		const value = await this.repository.findDigitizationJobById(id, tx, lock);
		if (!value) throw new ApplicationError(ApplicationErrorEnum.REGISTRY_RESOURCE_NOT_FOUND, { message: `Digitization job ${id} was not found` });
		return value;
	}

	private async requireEntry(id: string, tx?: Parameters<RegistryRepositoryPort["findEntryById"]>[1], lock = false) {
		const value = await this.repository.findEntryById(id, tx, lock);
		if (!value) throw new ApplicationError(ApplicationErrorEnum.REGISTRY_RESOURCE_NOT_FOUND, { message: `Registry entry ${id} was not found` });
		return value;
	}

	private async requireMovement(id: string, tx?: Parameters<RegistryRepositoryPort["findMovementById"]>[1], lock = false) {
		const value = await this.repository.findMovementById(id, tx, lock);
		if (!value) throw new ApplicationError(ApplicationErrorEnum.REGISTRY_RESOURCE_NOT_FOUND, { message: `Custody movement ${id} was not found` });
		return value;
	}
}

export { type RequestEvidence };
export default RegistryService;
