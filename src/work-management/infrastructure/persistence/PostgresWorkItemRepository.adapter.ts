import type { PostgresDb } from "@fastify/postgres";
import InfrastructureError from "../../../shared/errors/InfrastructureError.error.js";
import {
	Category,
	GlobalInfrastructureErrors,
} from "../../../shared/errors/enum/infrastructure.enum.js";
import type { WorkItemRepositoryPort } from "../../application/ports/WorkItemRepository.port.js";
import type {
	WorkItem,
	WorkItemActivity,
	WorkItemAuthority,
	WorkItemQuery,
	WorkItemVersion,
	WorkItemView,
} from "../../application/types/workItem.type.js";

interface WorkItemRow {
	task_id: string;
	task_status: "pending" | "approved" | "rejected";
	instance_status: "in_progress" | "completed" | "rejected";
	role: string;
	minute_id: string | null;
	assigned_at: Date;
	acted_at: Date | null;
	instruction: string | null;
	document_id: string;
	reference_number: string | null;
	title: string;
	classification: string;
	sensitivity: string;
	version_id: string | null;
	version_number: number | null;
	version_state: string | null;
	version_created_at: Date | null;
	integrity_status: string;
	authority_id: string | null;
	authority_designation_id: string | null;
	authority_name: string | null;
	authority_role: string | null;
	action_actor_id: string | null;
	action_designation_id: string | null;
	action_actor_name: string | null;
	action_actor_role: string | null;
}

class PostgresWorkItemRepository implements WorkItemRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async listForActor(actorId: string, query: WorkItemQuery): Promise<WorkItem[]> {
		try {
			const { sql, values } = this.buildQuery(actorId, query);
			const result = await this.dbPool.query<WorkItemRow>(sql, values);
			return result.rows.map((row) => this.toWorkItem(row, query.view));
		} catch (error: unknown) {
			throw this.persistenceError(error);
		}
	}

	async findForActor(actorId: string, workItemId: string): Promise<WorkItem | null> {
		for (const view of ["assigned", "returned", "completed"] as const) {
			const items = await this.listForActor(actorId, {
				view,
				sort: "newest",
				limit: 1,
				workItemId,
			});
			if (items[0]) return items[0];
		}
		return null;
	}

	private buildQuery(actorId: string, query: WorkItemQuery) {
		const values: unknown[] = [actorId];
		const conditions: string[] = [this.visibilityCondition(query.view)];
		const add = (condition: string, value: unknown) => {
			values.push(value);
			conditions.push(condition.replace("?", `$${values.length}`));
		};

		if (query.workItemId) add("wt.id = ?", query.workItemId);
		if (query.status) {
			const status = this.databaseStatus(query.view, query.status);
			if (status) add("wt.status = ?", status);
		}
		if (query.search) add("(doc.title ILIKE ? OR doc.reference_number ILIKE ? OR COALESCE(task_minute.content, step.description, wt.role) ILIKE ?)", `%${query.search}%`);
		if (query.search) {
			values.push(`%${query.search}%`, `%${query.search}%`);
			conditions[conditions.length - 1] = conditions.at(-1)!
				.replace("?", `$${values.length - 1}`)
				.replace("?", `$${values.length}`);
		}
		if (query.authorityId) {
			add(query.view === "returned" ? "wt.assigned_to = ?" : "doc.owner_id = ?", query.authorityId);
		}
		if (query.dueFrom) add("wt.created_at >= ?", query.dueFrom);
		if (query.dueTo) add("wt.created_at <= ?", query.dueTo);
		if (query.completedFrom) add("wt.acted_at >= ?", query.completedFrom);
		if (query.completedTo) add("wt.acted_at <= ?", query.completedTo);

		const direction = query.sort === "oldest" ? "ASC" : "DESC";
		if (query.cursorAt && query.cursorId) {
			values.push(query.cursorAt, query.cursorId);
			const comparator = direction === "ASC" ? ">" : "<";
			conditions.push(`(COALESCE(wt.acted_at, wt.created_at), wt.id) ${comparator} ($${values.length - 1}, $${values.length})`);
		}
		values.push(query.limit);

		return {
			values,
			sql: `
				SELECT
					wt.id AS task_id, wt.status AS task_status, wi.status AS instance_status,
					wt.role, wt.minute_id, wt.created_at AS assigned_at, wt.acted_at,
					COALESCE(task_minute.content, step.description, wt.role) AS instruction,
					doc.id AS document_id, doc.reference_number, doc.title,
					dt.name AS classification, doc.sensitivity::text,
					dv.id AS version_id, dv.version_number, dv.lifecycle_state::text AS version_state,
					dv.created_at AS version_created_at,
					CASE WHEN version_media.checksum IS NULL THEN 'not_verified' ELSE 'verified' END AS integrity_status,
					owner.id AS authority_id, owner.designation_id AS authority_designation_id,
					NULLIF(CONCAT_WS(' ', owner_user.first_name, owner_user.middle_name, owner_user.last_name), '') AS authority_name,
					owner_designation.title AS authority_role,
					assignee.id AS action_actor_id, assignee.designation_id AS action_designation_id,
					NULLIF(CONCAT_WS(' ', assignee_user.first_name, assignee_user.middle_name, assignee_user.last_name), '') AS action_actor_name,
					assignee_designation.title AS action_actor_role
				FROM workflow.workflow_tasks wt
				JOIN workflow.workflow_instances wi ON wi.id = wt.workflow_instance_id
				JOIN document.documents doc ON doc.id = wi.document_id
				JOIN document.document_type dt ON dt.id = doc.document_type_id
				LEFT JOIN document.document_versions dv ON dv.id = doc.current_version_id
				LEFT JOIN document.minutes task_minute ON task_minute.id = wt.minute_id
				LEFT JOIN LATERAL (
					SELECT aws.description
					FROM policy.approval_workflow_steps aws
					WHERE aws.document_type_id = doc.document_type_id AND aws.step_order = wt.step_order
					ORDER BY aws.policy_version DESC LIMIT 1
				) step ON TRUE
				LEFT JOIN LATERAL (
					SELECT ma.checksum
					FROM document.document_media_assets dma
					JOIN media.media_assets ma ON ma.id = dma.media_id
					WHERE dma.document_version_id = dv.id
					ORDER BY dma.assigned_at DESC LIMIT 1
				) version_media ON TRUE
				LEFT JOIN identity.staff owner ON owner.id = doc.owner_id
				LEFT JOIN identity.users owner_user ON owner_user.id = owner.identity_id
				LEFT JOIN identity.designations owner_designation ON owner_designation.id = owner.designation_id
				LEFT JOIN identity.staff assignee ON assignee.id = wt.assigned_to
				LEFT JOIN identity.users assignee_user ON assignee_user.id = assignee.identity_id
				LEFT JOIN identity.designations assignee_designation ON assignee_designation.id = assignee.designation_id
				WHERE ${conditions.join(" AND ")}
				ORDER BY COALESCE(wt.acted_at, wt.created_at) ${direction}, wt.id ${direction}
				LIMIT $${values.length};
			`,
		};
	}

	private visibilityCondition(view: WorkItemView) {
		switch (view) {
			case "assigned": return "wt.assigned_to = $1 AND wt.status = 'pending'";
			case "completed": return "wt.assigned_to = $1 AND wt.status IN ('approved', 'rejected')";
			case "returned": return "doc.owner_id = $1 AND wi.status = 'rejected' AND wt.status = 'rejected'";
		}
	}

	private databaseStatus(view: WorkItemView, status: string): string | null {
		if (view === "assigned" && ["assigned", "in_progress", "due_soon"].includes(status)) return null;
		if (view === "returned" && status === "returned") return null;
		if (view === "completed" && status === "completed") return null;
		return status;
	}

	private toWorkItem(row: WorkItemRow, view: WorkItemView): WorkItem {
		const assigningAuthority = this.authority(row, "authority");
		const actionAuthority = this.authority(row, "action");
		const version = this.version(row);
		const base: WorkItem = {
			id: row.task_id,
			view,
			status: view === "assigned" ? "assigned" : view,
			document: {
				id: row.document_id,
				reference: row.reference_number ?? "Unnumbered",
				title: row.title,
				classification: row.classification,
				sensitivity: row.sensitivity,
				version,
			},
			instruction: row.instruction ?? row.role,
			assigningAuthority,
			assignedAt: new Date(row.assigned_at),
		};

		if (view === "assigned") {
			base.dueAt = new Date(row.assigned_at);
			base.progressLabel = "Deadline not configured";
		} else if (view === "returned") {
			const returnedAt = new Date(row.acted_at ?? row.assigned_at);
			base.returnedAt = returnedAt;
			base.returnedBy = actionAuthority;
			base.returnReason = row.instruction ?? "Workflow task was rejected";
			base.requiredCorrection = row.instruction ?? "Review the rejection and resubmit the document";
			base.resubmissionDueAt = returnedAt;
			base.previousSubmission = { ...version, submittedAt: new Date(row.version_created_at ?? row.assigned_at) };
		} else {
			base.outcome = row.task_status;
			base.completedAt = new Date(row.acted_at ?? row.assigned_at);
			base.finalAuthority = actionAuthority;
			base.resultingState = row.version_state ?? row.instance_status;
			base.authoritativeVersion = version;
		}

		base.activity = this.activity(row, assigningAuthority, actionAuthority, view);
		return base;
	}

	private authority(row: WorkItemRow, kind: "authority" | "action"): WorkItemAuthority {
		if (kind === "authority") return {
			actorId: row.authority_id,
			designationId: row.authority_designation_id,
			displayName: row.authority_name ?? "System authority",
			role: row.authority_role ?? "Document owner",
		};
		return {
			actorId: row.action_actor_id,
			designationId: row.action_designation_id,
			displayName: row.action_actor_name ?? "Workflow authority",
			role: row.action_actor_role ?? row.role,
		};
	}

	private version(row: WorkItemRow): WorkItemVersion {
		const number = row.version_number ?? 0;
		return {
			id: row.version_id ?? `unversioned:${row.document_id}`,
			number,
			label: number > 0 ? `Version ${number}` : "Unversioned",
			integrityStatus: row.integrity_status,
		};
	}

	private activity(row: WorkItemRow, assigning: WorkItemAuthority, action: WorkItemAuthority, view: WorkItemView) {
		const events: WorkItemActivity[] = [{
			id: `${row.task_id}:assigned`,
			event: `Assigned for ${row.role}`,
			actor: assigning,
			occurredAt: new Date(row.assigned_at),
			evidenceId: null,
		}];
		if (view !== "assigned") events.push({
			id: `${row.task_id}:${row.task_status}`,
			event: view === "returned" ? "Work returned" : `Task ${row.task_status}`,
			actor: action,
			occurredAt: new Date(row.acted_at ?? row.assigned_at),
			evidenceId: row.minute_id,
		});
		return events;
	}

	private persistenceError(error: unknown) {
		return new InfrastructureError(
			GlobalInfrastructureErrors.persistence.UNREGISTERED_ERROR,
			{ category: Category.PERSISTENCE, message: error instanceof Error ? error.message : String(error), cause: error },
		);
	}
}

export default PostgresWorkItemRepository;
