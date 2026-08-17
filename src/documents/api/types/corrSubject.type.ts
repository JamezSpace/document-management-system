import { Type, type Static } from "@fastify/type-provider-typebox";

const corrSubjectSchema = Type.Object({
    code: Type.String(),
    name: Type.String(),
    description: Type.Optional(Type.String())
});


type CorrSubjectType = Static<typeof corrSubjectSchema>;

export {
    corrSubjectSchema, type CorrSubjectType
}