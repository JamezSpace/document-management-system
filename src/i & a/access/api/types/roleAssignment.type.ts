import { Type, type Static } from "@fastify/type-provider-typebox";

const authorizationScopeSchema = Type.Union([
	Type.Object(
		{ type: Type.Literal("organization"), id: Type.Null() },
		{ additionalProperties: false },
	),
	Type.Object(
		{ type: Type.Literal("unit"), id: Type.String({ minLength: 1 }) },
		{ additionalProperties: false },
	),
	Type.Object(
		{ type: Type.Literal("office"), id: Type.String({ minLength: 1 }) },
		{ additionalProperties: false },
	),
]);

const assignRoleSchema = Type.Object(
	{
		staffId: Type.String({ minLength: 1 }),
		roleId: Type.String({ minLength: 1 }),
		scope: authorizationScopeSchema,
		validFrom: Type.Optional(Type.String({ format: "date-time" })),
		validTo: Type.Optional(
			Type.Union([Type.String({ format: "date-time" }), Type.Null()]),
		),
	},
	{ additionalProperties: false },
);

const delegateRoleSchema = Type.Object(
	{
		staffId: Type.String({ minLength: 1 }),
		validFrom: Type.Optional(Type.String({ format: "date-time" })),
		validTo: Type.String({ format: "date-time" }),
	},
	{ additionalProperties: false },
);

const roleAssignmentIdSchema = Type.Object({
	assignmentId: Type.String({ minLength: 1 }),
});

const roleAssignmentStaffIdSchema = Type.Object({
	staffId: Type.String({ minLength: 1 }),
});

type AssignRoleType = Static<typeof assignRoleSchema>;
type DelegateRoleType = Static<typeof delegateRoleSchema>;
type RoleAssignmentIdType = Static<typeof roleAssignmentIdSchema>;
type RoleAssignmentStaffIdType = Static<typeof roleAssignmentStaffIdSchema>;

export {
	assignRoleSchema,
	authorizationScopeSchema,
	delegateRoleSchema,
	roleAssignmentIdSchema,
	roleAssignmentStaffIdSchema,
	type AssignRoleType,
	type DelegateRoleType,
	type RoleAssignmentIdType,
	type RoleAssignmentStaffIdType,
};
