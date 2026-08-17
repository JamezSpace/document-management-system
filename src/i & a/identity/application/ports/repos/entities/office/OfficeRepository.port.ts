import type Office from "../../../../../domain/entities/office/Office.js";

interface OfficeRepositoryPort {
    save(office: Office): Promise<Office>;

    findOfficeById(id: string): Promise<Office | null>;

    findOfficesByUnitId(unitId: string): Promise<Office[]>;

    fetchAllOffices(): Promise<Office[]>
}

export type { OfficeRepositoryPort };

