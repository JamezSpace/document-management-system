enum StaffMediaRole {
    SIGNATURE = 'signature',
    PROFILE_PIC = 'profile_pic'
}

enum DocumentMediaRole {
    PRIMARY_CONTENT = 'primary_content',
    ATTACHMENT = 'attachment'
}

interface MediaRole {
    staff: StaffMediaRole;
    document: DocumentMediaRole;
}

export type {MediaRole}