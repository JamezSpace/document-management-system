import { Type, type Static } from "@fastify/type-provider-typebox";
import { EmploymentType, Status } from "../../../domain/enum/staff.enum.js";

const createStaffSchema = Type.Object({
	identityId: Type.String(),
	staffNumber: Type.Number(),
	employmentType: Type.Enum(EmploymentType),
	unitId: Type.String(),
	officeId: Type.String(),
	designationId: Type.String(),
	status: Type.Enum(Status),
	createdBy: Type.String(),
	activatedBy: Type.String(),
	activatedAt: Type.String({ format: "date-time" }),
});

const registerStaffSchema = Type.Object({
	firstName: Type.String(),
	lastName: Type.String(),
	middleName: Type.String(),
	email: Type.String(),
	phoneNumber: Type.String(),

	staffNumber: Type.Number(),
	employmentType: Type.Enum(EmploymentType),
	unitId: Type.String(),
	officeId: Type.String(),
	designationId: Type.String(),

    createdBy: Type.String()
});

const activateStaffSchema = Type.Object({
    profilePic: Type.Any(),
    signatureFile: Type.Any()
})

const staffIdSchema = Type.Object({
	staffId: Type.String(),
});

const authProviderIdSchema = Type.Object({
	authProviderId: Type.String(),
});

const userIdSchema = Type.Object({
	uid: Type.String(),
});

enum StaffMediaRequester {
	ME = "me",
	OTHER = "other",
}

const staffMediaNeededBySchema = Type.Object({
	requestMadeBy: Type.Enum(StaffMediaRequester),
});

const unitIdSchema = Type.Object({
	unitId: Type.String()
});

const editStaffSchema = Type.Partial(registerStaffSchema);

type CreateStaffType = Static<typeof createStaffSchema>;
type RegisterStaffType = Static<typeof registerStaffSchema>;
type ActivateStaffType = Static<typeof activateStaffSchema>;
type EditStaffType = Static<typeof editStaffSchema>;
type StaffIdType = Static<typeof staffIdSchema>;
type AuthProviderIdType = Static<typeof authProviderIdSchema>;
type UserIdType = Static<typeof userIdSchema>;
type UnitIdType = Static<typeof unitIdSchema>;
type StaffMediaNeededByType = Static<typeof staffMediaNeededBySchema>;

export {
	createStaffSchema,
	editStaffSchema,
	registerStaffSchema,
    activateStaffSchema,
	staffIdSchema,
    authProviderIdSchema,
	staffMediaNeededBySchema,
	StaffMediaRequester,
	unitIdSchema,
    userIdSchema,
    type UserIdType,
	type CreateStaffType,
	type EditStaffType,
	type RegisterStaffType,
    type ActivateStaffType,
	type StaffIdType,
    type AuthProviderIdType,
	type StaffMediaNeededByType,
	type UnitIdType,
};
