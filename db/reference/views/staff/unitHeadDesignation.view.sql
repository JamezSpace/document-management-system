-- REFERENCE-ONLY SQL CATALOGUE. `db/migrations` is the authoritative schema history.
-- Do not apply this file as a schema change. Add every new or modified database change
-- to a numbered migration first; mirror it here only for browsing or test support.

CREATE OR REPLACE VIEW identity.unit_head_designation AS
select d.id, title, unit_id
from identity.offices o
join identity.designations d
on d.office_id = o.id
join identity.designation_capability_defaults dcd
on dcd.designation_id = d.id
join identity.capability_classes cc
on cc.id = dcd.capability_class_id
where (cc.name = 'unit head' AND cc.category = 'leadership');
