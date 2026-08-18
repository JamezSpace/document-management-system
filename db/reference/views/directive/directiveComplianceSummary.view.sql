-- REFERENCE-ONLY SQL CATALOGUE. `db/migrations` is the authoritative schema history.
-- Do not apply this file as a schema change. Add every new or modified database change
-- to a numbered migration first; mirror it here only for browsing or test support.

CREATE VIEW directive.directive_compliance_summary AS
SELECT
    d.id AS directive_id,
    COUNT(r.staff_id) AS total_recipients,
    COUNT(r.seen_at) AS seen_count,
    COUNT(r.acknowledged_at) AS acknowledged_count
FROM directive.directives d
LEFT JOIN directive.directive_staff_recipients r
    ON d.id = r.directive_id
GROUP BY d.id;
