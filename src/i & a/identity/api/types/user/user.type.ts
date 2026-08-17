import { Type, type Static } from "@fastify/type-provider-typebox";
import { IdentityStatus } from "../../../domain/entities/user/IdentityStatus.js";
import { EmploymentType } from "../../../domain/enum/staff.enum.js";

const userSchema = Type.Object({
	uid: Type.String(),
	email: Type.String(),
	phoneNum: Type.String(),
	status: Type.Enum(IdentityStatus),
	authProvider: Type.String(),
	authProviderId: Type.String(),
	firstName: Type.String(),
	lastName: Type.String(),
	middleName: Type.String(),
});

const userSchemaForSignup = Type.Object({
	email: Type.String(),
	phoneNum: Type.String(),
	authProvider: Type.String(),
	authProviderId: Type.String(),
	firstName: Type.String(),
	lastName: Type.String(),
	middleName: Type.String(),
});

const userSchemaForLogin = Type.Object({
	authProviderId: Type.String(),
});

const tokenIdSchema = Type.Object({
	token: Type.String(),
});

const inviteIdSchema = Type.Object({
	inviteId: Type.String(),
});

const initInviteSchema = Type.Object({
	email: Type.String(),

    employmentType: Type.Enum(EmploymentType),
	unitId: Type.String(),
	officeId: Type.String(),
	designationId: Type.String(),

    createdBy: Type.String()
});

const initOnboardingSessionSchema = Type.Object({
	inviteId: Type.String(),
	email: Type.String(),
});

const editOnboardingSessionSchema = Type.Object({
	primaryData: Type.Object({
		firstName: Type.String(),
		lastName: Type.String(),
		middleName: Type.String(),
		email: Type.String(),
        phoneNumber: Type.String({minLength: 11, maxLength: 14}),
		staffId: Type.Number({minimum: 100000}),
	}),
	currentStep: Type.Number({ maximum: 5 }),
});

const sessionIdSchema = Type.Object({
	sessionId: Type.String(),
});

const uploadOnboardingMediaSchema = Type.Object({
	profilePic: Type.Optional(Type.Any()),
	signatureFile: Type.Optional(Type.Any()),
	currentStep: Type.Number({ minimum: 1, maximum: 5 }),
});

type User = Static<typeof userSchema>;
type UserSignUpType = Static<typeof userSchemaForSignup>;
type UserLoginType = Static<typeof userSchemaForLogin>;
type TokenIdType = Static<typeof tokenIdSchema>;
type InviteIdType = Static<typeof inviteIdSchema>;
type InitInviteType = Static<typeof initInviteSchema>;
type InitOnboardingSessionType = Static<typeof initOnboardingSessionSchema>;
type EditOnboardingSessionType = Static<typeof editOnboardingSessionSchema>;
type UploadOnboardingMediaType = Static<typeof uploadOnboardingMediaSchema>;
type SessionIdType = Static<typeof sessionIdSchema>;

export {
    editOnboardingSessionSchema,initOnboardingSessionSchema, sessionIdSchema, tokenIdSchema, inviteIdSchema, initInviteSchema, uploadOnboardingMediaSchema, userSchema,
    userSchemaForLogin,
    userSchemaForSignup, type EditOnboardingSessionType, type InitOnboardingSessionType, type SessionIdType, type InviteIdType, type InitInviteType, type TokenIdType, type UploadOnboardingMediaType, type User,
    type UserLoginType,
    type UserSignUpType
};

