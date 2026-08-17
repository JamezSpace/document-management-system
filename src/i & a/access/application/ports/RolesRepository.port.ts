import type Role from "../../domain/role/Role.js";

interface RoleRepositoryPort {
	findById(id: string): Promise<Role | null>;

	findByName(name: string): Promise<Role | null>;

	findAll(): Promise<Role[]>;
    
	save(role: Role): Promise<void>;
}

export { type RoleRepositoryPort };
