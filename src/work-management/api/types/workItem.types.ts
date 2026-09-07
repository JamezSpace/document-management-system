import { Type, type Static } from "@sinclair/typebox";

const workItemQuerySchema = Type.Object({
	view: Type.Union([
		Type.Literal("assigned"),
		Type.Literal("returned"),
		Type.Literal("completed"),
	]),
	search: Type.Optional(Type.String({ maxLength: 200 })),
	authorityId: Type.Optional(Type.String({ minLength: 1, maxLength: 80 })),
	status: Type.Optional(Type.String({ minLength: 1, maxLength: 40 })),
	dueFrom: Type.Optional(Type.String()),
	dueTo: Type.Optional(Type.String()),
	completedFrom: Type.Optional(Type.String()),
	completedTo: Type.Optional(Type.String()),
	sort: Type.Optional(Type.Union([Type.Literal("newest"), Type.Literal("oldest")])),
	limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
	cursor: Type.Optional(Type.String({ minLength: 1 })),
});

const workItemParamsSchema = Type.Object({
	workItemId: Type.String({ minLength: 1, maxLength: 80 }),
});

type WorkItemQueryType = Static<typeof workItemQuerySchema>;
type WorkItemParamsType = Static<typeof workItemParamsSchema>;

export {
	workItemParamsSchema,
	workItemQuerySchema,
	type WorkItemParamsType,
	type WorkItemQueryType,
};
