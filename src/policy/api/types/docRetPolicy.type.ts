import { Type, type Static } from "@fastify/type-provider-typebox";

const createDocumentRetentionPolicySchema = Type.Object({
    documentTypeId: Type.String(),
    archivalRequired: Type.Boolean(),
    retentionDuration: Type.Number(),
    effectiveFrom: Type.String({format: 'date-time'})
})

type CreateDocumentRetentionPolicyType = Static<typeof createDocumentRetentionPolicySchema>;

export {
    createDocumentRetentionPolicySchema, type CreateDocumentRetentionPolicyType
}