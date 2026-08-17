import { strict as assert } from "node:assert";
import { test } from "node:test";

import DomainError from "../../src/shared/errors/DomainError.error.js";
import WorkflowTask from "../../src/workflow/domain/entities/WorkflowTask.js";
import { WorkflowTaskStatus } from "../../src/workflow/domain/enum/WorkflowTaskStatus.enum.js";

function pendingTask(): WorkflowTask {
	return new WorkflowTask({
		id: "task-1",
		workflowInstanceId: "workflow-1",
		stepOrder: 1,
		assignedTo: "staff-1",
		role: "reviewer",
		status: WorkflowTaskStatus.PENDING,
	});
}

test("the assigned staff member can approve a pending workflow task", () => {
	const task = pendingTask();

	task.approve("staff-1", "minute-1");

	assert.equal(task.getStatus(), WorkflowTaskStatus.APPROVED);
	assert.equal(task.getMinuteId(), "minute-1");
});

test("a staff member who is not assigned cannot action a workflow task", () => {
	const task = pendingTask();

	assert.throws(
		() => task.approve("staff-2"),
		(error: unknown) => {
			assert.ok(error instanceof DomainError);
			assert.equal(error.errorCode, "unauthorised_approval");
			return true;
		},
	);
	assert.equal(task.getStatus(), WorkflowTaskStatus.PENDING);
});

test("rejecting a workflow task requires a non-blank minute", () => {
	const task = pendingTask();

	assert.throws(
		() => task.reject("staff-1", "   "),
		(error: unknown) => {
			assert.ok(error instanceof DomainError);
			assert.equal(error.errorCode, "rejection_minute_required");
			return true;
		},
	);
	assert.equal(task.getStatus(), WorkflowTaskStatus.PENDING);
	assert.equal(task.getMinuteId(), null);
});

test("a processed workflow task cannot be actioned a second time", () => {
	const task = pendingTask();
	task.approve("staff-1");

	assert.throws(
		() => task.reject("staff-1", "minute-2"),
		(error: unknown) => {
			assert.ok(error instanceof DomainError);
			assert.equal(error.errorCode, "invalid_operation");
			return true;
		},
	);
	assert.equal(task.getStatus(), WorkflowTaskStatus.APPROVED);
});
