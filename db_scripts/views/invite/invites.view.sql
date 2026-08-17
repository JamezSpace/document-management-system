CREATE OR REPLACE VIEW identity.all_invites AS
SELECT
    i.id,
    i.email,

    i.employment_type AS "employmentType",

    -- inviter from staff_details view
    jsonb_build_object(
        'id', sd.id,
        'staffNumber', sd.staff_number,
        'fullName', sd.full_name,

        'unit',
        jsonb_build_object(
            'id', sd.unit_id,
            'name', sd.unit_name,
            'sector', sd.unit_sector
        ),

        'office',
        jsonb_build_object(
            'id', sd.office_id,
            'name', sd.office_name
        ),

        'designation',
        jsonb_build_object(
            'id', sd.designation_id,
            'title', sd.designation_title
        )
    ) AS invited_by,


    -- invited person's assigned unit
    jsonb_build_object(
        'id', iu.id,
        'name', iu.full_name,
        'sector', iu.sector
    ) AS unit,


    -- invited person's assigned office
    jsonb_build_object(
        'id', io.id,
        'name', io.name
    ) AS office,


    -- invited person's assigned designation
    jsonb_build_object(
        'id', idg.id,
        'title', idg.title
    ) AS designation,


    i.token       AS "token",
    i.is_used     AS "isUsed",
    i.expires_at  AS "expiresAt",
    i.accepted_at AS "acceptedAt",
    i.rejected_at AS "rejectedAt",
    i.status      AS "status",
    i.created_at  AS "createdAt",
    i.updated_at  AS "updatedAt"

FROM identity.invites i

LEFT JOIN identity.staff_details sd
ON i.invited_by = sd.id

LEFT JOIN identity.organizational_units iu
ON i.unit_id = iu.id

LEFT JOIN identity.offices io
ON i.office_id = io.id

LEFT JOIN identity.designations idg
ON i.designation_id = idg.id

WHERE sd.id <> 'staff.system';