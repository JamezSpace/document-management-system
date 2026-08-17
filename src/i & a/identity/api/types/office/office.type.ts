import { Type, type Static } from "@fastify/type-provider-typebox";

const createOfficeSchema = Type.Object({
    name: Type.String(),
    unitId: Type.String()
})

const createDesignationSchema = Type.Object({
    title: Type.String(),
    description: Type.Optional(Type.String()),
    officeId: Type.String()
})

const editDesignationSchema = Type.Object({
    officeId: Type.String()
})

type CreateOfficeType = Static<typeof createOfficeSchema>
type CreateDesignationType = Static<typeof createDesignationSchema>
type EditDesignationType = Static<typeof editDesignationSchema>

export {
    createDesignationSchema,
    createOfficeSchema,
    editDesignationSchema,
    type CreateDesignationType,
    type CreateOfficeType,
    type EditDesignationType
};
