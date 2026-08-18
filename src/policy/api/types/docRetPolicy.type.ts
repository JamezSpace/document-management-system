import { Type, type Static } from "@fastify/type-provider-typebox";

const createDocumentRetentionPolicySchema = Type.Object({
    documentTypeId: Type.String(),
    archivalRequired: Type.Boolean(),
	retentionDuration: Type.Integer({ minimum: 1 }),
	effectiveFrom: Type.String({ format: "date" }),
})

type CreateDocumentRetentionPolicyType = Static<typeof createDocumentRetentionPolicySchema>;

export {
    createDocumentRetentionPolicySchema, type CreateDocumentRetentionPolicyType
}
