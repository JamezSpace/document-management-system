import { Type, type Static } from "@fastify/type-provider-typebox";

const documentIdSchema = Type.Object({
    documentId: Type.String({minLength: 2})
})

type DocumentIdSchemaType = Static<typeof documentIdSchema>;

export { documentIdSchema, type DocumentIdSchemaType };
