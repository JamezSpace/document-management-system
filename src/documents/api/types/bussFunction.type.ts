import { Type, type Static } from "@fastify/type-provider-typebox";

const bussFunctionSchema = Type.Object({
    subjectId: Type.String(),
    code: Type.String(),
    name: Type.String(),
    description: Type.Optional(Type.String())
})

type BussFunctionType = Static<typeof bussFunctionSchema>;


export {
    bussFunctionSchema, type BussFunctionType
}