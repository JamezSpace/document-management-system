import { Type, type Static } from "@sinclair/typebox";
import { OrganizationalUnitSector } from "../../../domain/enum/orgUnitSector.enum.js";

const createOrgUnitSchema = Type.Object({
	code: Type.Optional(Type.String()),
    fullName: Type.String(),
    description: Type.String(),
	sector: Type.Enum(OrganizationalUnitSector),
	parentId: Type.Optional(Type.String()),
});

type CreateOrgUnitType = Static<typeof createOrgUnitSchema>;

export { createOrgUnitSchema, type CreateOrgUnitType };
