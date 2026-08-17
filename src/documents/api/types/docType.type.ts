import { Type, type Static } from "@fastify/type-provider-typebox";

const docTypeIdSchema = Type.Object({
    typeId: Type.String()
})

const docTypeCreationSchema = Type.Object({
    code: Type.String(),
    name: Type.String(),
})

type DocTypeCreationType = Static<typeof docTypeCreationSchema>;
type DocTypeIdSchemaType = Static<typeof docTypeIdSchema>;

export {
    docTypeCreationSchema, type DocTypeCreationType,
    docTypeIdSchema, type DocTypeIdSchemaType
}