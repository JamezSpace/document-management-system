import { strict as assert } from "node:assert";
import { test } from "node:test";
import fastify from "fastify";
import type { WorkItemRepositoryPort } from "../../src/work-management/application/ports/WorkItemRepository.port.js";
import type { WorkItem, WorkItemQuery } from "../../src/work-management/application/types/workItem.type.js";
import GetWorkItemUseCase from "../../src/work-management/application/usecases/GetWorkItem.usecase.js";
import ListWorkItemsUseCase from "../../src/work-management/application/usecases/ListWorkItems.usecase.js";
import WorkManagementSubsystem from "../../src/work-management/index.js";

function item(id: string, assignedAt: string): WorkItem {
	return {
		id,
		view: "assigned",
		status: "assigned",
		document: {
			id: `document-${id}`,
			reference: `REF-${id}`,
			title: `Document ${id}`,
			classification: "Memo",
			sensitivity: "internal",
			version: { id: `version-${id}`, number: 1, label: "Version 1", integrityStatus: "verified" },
		},
		instruction: "Review",
		assigningAuthority: { actorId: "owner-1", designationId: null, displayName: "Owner", role: "Owner" },
		assignedAt: new Date(assignedAt),
		dueAt: new Date(assignedAt),
	};
}

class FakeWorkItemRepository implements WorkItemRepositoryPort {
	lastQuery: WorkItemQuery | null = null;

	constructor(private readonly items: WorkItem[]) {}

	async listForActor(_actorId: string, query: WorkItemQuery) {
		this.lastQuery = query;
		return this.items.slice(0, query.limit);
	}

	async findForActor(_actorId: string, workItemId: string) {
		return this.items.find((candidate) => candidate.id === workItemId) ?? null;
	}
}

test("list work items scopes pagination and emits an opaque next cursor", async () => {
	const repository = new FakeWorkItemRepository([
		item("3", "2026-09-03T00:00:00.000Z"),
		item("2", "2026-09-02T00:00:00.000Z"),
		item("1", "2026-09-01T00:00:00.000Z"),
	]);
	const useCase = new ListWorkItemsUseCase(repository);

	const page = await useCase.execute("staff-1", { view: "assigned", limit: 2 });

	assert.deepEqual(page.items.map((entry) => entry.id), ["3", "2"]);
	assert.equal(page.pageInfo.hasNextPage, true);
	assert.equal(typeof page.pageInfo.nextCursor, "string");
	assert.equal(repository.lastQuery?.limit, 3);

	await useCase.execute("staff-1", {
		view: "assigned",
		limit: 2,
		cursor: page.pageInfo.nextCursor!,
	});
	assert.equal(repository.lastQuery?.cursorId, "2");
	assert.equal(repository.lastQuery?.cursorAt?.toISOString(), "2026-09-02T00:00:00.000Z");
});

test("work-item detail cannot expose an item outside the actor scope", async () => {
	const useCase = new GetWorkItemUseCase(new FakeWorkItemRepository([]));

	await assert.rejects(
		() => useCase.execute("staff-1", "task-unknown"),
		(error: unknown) => error instanceof Error && error.message.includes("task-unknown"),
	);
});

test("work-management subsystem serves the frontend collection route", async (t) => {
	const app = fastify({ logger: false });
	const repository = new FakeWorkItemRepository([item("1", "2026-09-01T00:00:00.000Z")]);
	app.decorateRequest("actor", null);
	app.addHook("preHandler", async (request) => {
		request.actor = {
			identityId: "identity-1",
			staffId: "staff-1",
			officeId: "office-1",
			unitId: "unit-1",
			grants: [],
		};
	});
	await app.register(WorkManagementSubsystem, {
		prefix: "/api/work-items",
		repository,
	});
	t.after(() => app.close());

	const response = await app.inject({ method: "GET", url: "/api/work-items?view=assigned" });

	assert.equal(response.statusCode, 200);
	assert.equal(response.json().success, true);
	assert.equal(response.json().data.items[0].id, "1");
});
