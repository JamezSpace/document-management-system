import { Type, type Static } from "@fastify/type-provider-typebox";

const documentIdSchema = Type.Object({
	documentId: Type.String(),
});

const taskIdSchema = Type.Object({
	taskId: Type.String(),
});

const workflowTaskApprovalSchema = Type.Object({
	minuteId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

const workflowTaskRejectionSchema = Type.Object({
	minuteId: Type.String({ minLength: 1 }),
});

type DocumentIdType = Static<typeof documentIdSchema>;
type TaskIdType = Static<typeof taskIdSchema>;
type WorkflowTaskApprovalType = Static<typeof workflowTaskApprovalSchema>;
type WorkflowTaskRejectionType = Static<typeof workflowTaskRejectionSchema>;

export {
	documentIdSchema,
	taskIdSchema,
	workflowTaskApprovalSchema,
	workflowTaskRejectionSchema,
	type DocumentIdType,
	type TaskIdType,
	type WorkflowTaskApprovalType,
	type WorkflowTaskRejectionType,
};
