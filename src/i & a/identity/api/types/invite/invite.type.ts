import { Type, type Static } from "@fastify/type-provider-typebox";

const inviteIdSchema = Type.Object({
    id: Type.String()
});

type InviteIdType = Static<typeof inviteIdSchema>;

export {
    inviteIdSchema, type InviteIdType
}