import { Type, type Static } from "@sinclair/typebox";

const auditEventQuerySchema = Type.Object({
	actorId: Type.Optional(Type.String()),
	eventType: Type.Optional(Type.String()),
	aggregateType: Type.Optional(Type.String()),
	aggregateId: Type.Optional(Type.String()),
	officeId: Type.Optional(Type.String()),
	unitId: Type.Optional(Type.String()),
	outcome: Type.Optional(
		Type.Union([
			Type.Literal("success"),
			Type.Literal("denied"),
			Type.Literal("failed"),
		]),
	),
	before: Type.Optional(Type.String({ format: "date-time" })),
	limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
});

type AuditEventQuery = Static<typeof auditEventQuerySchema>;

export { auditEventQuerySchema, type AuditEventQuery };
