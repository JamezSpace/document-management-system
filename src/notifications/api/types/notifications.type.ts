import { Type, type Static } from "@fastify/type-provider-typebox";

const staffIdSchema = Type.Object({
    sId: Type.String({minLength: 5})
})

type StaffIdType = Static<typeof staffIdSchema>;

export {
    staffIdSchema, type StaffIdType
};