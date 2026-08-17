CREATE OR REPLACE VIEW identity.staff_details AS
SELECT 
    staff.id, 
    users.auth_provider_id,
    staff.identity_id, 

    users.first_name,
    users.middle_name,
    users.last_name,

    CONCAT_WS(' ', INITCAP(users.first_name), INITCAP(users.last_name)) AS full_name,

    users.email,
    staff.staff_number, 
    staff.employment_type, 

    unit.id AS unit_id,
    unit.sector AS unit_sector, 
    unit.full_name AS unit_name,

    office.id AS office_id,
    office.name AS office_name, 

    designation.id AS designation_id,
    designation.title AS designation_title,

    staff.status, 
    staff.created_at, 
    staff.updated_at 

FROM identity.staff staff
LEFT JOIN identity.users users 
ON staff.identity_id = users.id
LEFT JOIN identity.organizational_units unit 
ON staff.unit_id = unit.id
LEFT JOIN identity.offices office 
ON staff.office_id = office.id
LEFT JOIN identity.designations designation 
ON staff.designation_id = designation.id
WHERE staff.id <> 'staff.system';