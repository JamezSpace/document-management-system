import {type DesignationPayload} from "../../type/office/designation.type.js"

class Designation {
    private readonly id : string;
	readonly title :string;
	readonly description? :string | undefined;
	readonly officeId:string;
	readonly createdAt?:Date;
	readonly updatedAt?:Date | undefined;

    constructor(payload: DesignationPayload) {
        this.id = payload.id;
        this.title = payload.title;
        this.description = payload.description;
        this.officeId = payload.officeId;

        this.createdAt = payload.createdAt ?? new Date();
        this.updatedAt = payload.updatedAt;
    }

    getDesignationId() {
        return this.id;
    }
}

export default Designation;