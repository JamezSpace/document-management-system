CREATE UNIQUE INDEX one_active_classification_per_staff
ON identity.staff_classifications(staff_id)
WHERE effective_to IS NULL;