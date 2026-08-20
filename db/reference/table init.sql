-- REFERENCE-ONLY SQL CATALOGUE. `db/migrations` is the authoritative schema history.
-- Do not apply this file as a schema change. Add every new or modified database change
-- to a numbered migration first; mirror it here only for browsing or test support.

CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS media;
CREATE SCHEMA IF NOT EXISTS document;
CREATE SCHEMA IF NOT EXISTS directive;
CREATE SCHEMA IF NOT EXISTS dispatch;
CREATE SCHEMA IF NOT EXISTS policy;
CREATE SCHEMA IF NOT EXISTS workflow;
CREATE SCHEMA IF NOT EXISTS notifications;

drop table if exists identity.users cascade;
drop table if exists identity.staff;
drop table if exists document.correspondence_subjects;
drop table if exists document.business_functions;

-- IDENTITY SCHEMA TYPES
CREATE TYPE identity.user_status AS ENUM (
    'pending','active','suspended', 'deleted', 'retired', 'resigned', 'terminated'
);
CREATE TYPE identity.invite_status AS ENUM (
    'pending','accepted','rejected', 'expired'
);
CREATE TYPE identity.onboarding_session_status AS ENUM (
    'in_progress','completed','abandoned'
);
CREATE TYPE identity.employment_type AS ENUM (
    'permanent', 'probationary', 'contract', 'intern', 'ad_hoc', 'sabbatical'
);
CREATE TYPE identity.org_unit_sector AS ENUM(
	'academic', 'non-academic'
);
CREATE TYPE identity.capability_class_category AS ENUM(
	'leadership', 'professional officers', 'clerical & records', 'operational support'
);
CREATE TYPE identity.role_assignments_source AS ENUM(
	'derived', 'manual'
);
CREATE TYPE identity.activation_status AS ENUM (
    'pending',
    'processing',
    'failed',
    'completed'
);
CREATE TYPE identity.recovery_task_status AS ENUM (
    'pending',
    'resolved',
    'failed'
);
CREATE TYPE identity.recovery_task_type AS ENUM (
    'staff_creation',
    'staff_activation',
    'email_delivery'
);

-- POLICY-OWNED DOCUMENT GOVERNANCE TYPES
CREATE TYPE policy.document_sensitivity_level AS ENUM(
	'public', 'internal', 'confidential', 'restricted'
);

CREATE TYPE policy.document_governance_policy_status AS ENUM(
	'draft', 'approved', 'active', 'retired'
);

CREATE TYPE policy.document_governance_rule_effect AS ENUM(
	'allow', 'deny'
);

-- DOCUMENT SCHEMA TYPES
CREATE TYPE document.correspondence_direction AS ENUM(
	'internal', 'external'
);
CREATE TYPE document.lifecycle_state AS ENUM(
	'draft', 'in_review', 'active', 'declared_record', 'archived', 'cancelled', 'disposed'
);
CREATE TYPE document.lifecycle_actions AS ENUM(
	'save', 'create', 'submit', 'approve', 'reject',  'cancel', 'activate', 'declare_record', 'archive', 'delete', 'dispose'
);
CREATE TYPE document.minute_action AS ENUM(
	'comment', 'instruction', 'recommend', 'approve',
    'reject', 'forward', 'escalate', 'acknowledge'
);
CREATE TYPE document.relationship_type AS ENUM (
    'attachment', 'annexure',
    'reference', 'related'
);


-- DISPATCH SCHEMA TYPES
CREATE TYPE dispatch.dispatch_type AS ENUM(
    'direct', 'cc', 'broadcast', 'forward', 'escalation'
);
CREATE TYPE dispatch.status AS ENUM(
    'pending', 'delivered', 'read', 'acknowledged', 'forwarded'
);
CREATE TYPE dispatch.inbox_entry_status AS ENUM(
	'unread', 'read', 'acknowledged', 'in_handover'
);

-- WORKFLOW SCHEMA TYPES
CREATE TYPE workflow.instance_status as ENUM(
    'in_progress','completed', 'rejected'
);

CREATE TYPE workflow.task_status as ENUM(
    'pending','approved', 'rejected'
);

-- POLICY SCHEMA TYPES
CREATE TYPE policy.resolution_strategy AS ENUM (
    'direct_supervisor',
    'role_in_unit',
    'role_in_office'
);

-- DIRECTIVE SCHEMA TYPES
CREATE TYPE directive.priority AS ENUM (
    'urgent',
    'standard'
);
CREATE TYPE directive.registry_volume AS ENUM (
    'operations',
    'official'
);
CREATE TYPE directive.status AS ENUM (
    'draft',
    'active',
    'cancelled'
);

-- NOTIFICATIONS SCHEMA TYPES
CREATE TYPE notifications.recipient_type as ENUM (
    'user', 'role'
);
CREATE TYPE notifications.preference as ENUM (
    'in app', 'email'
);
CREATE TYPE notifications.priority as ENUM (
    'low', 'high', 'normal'
);
CREATE TYPE notifications.state as ENUM (
    'pending', 'sent', 'failed', 'read'
);

-- MEDIA TYPES
CREATE TYPE media.uploaded_by_type as ENUM (
    'staff', 'onboarding_session', 'system'
);



-- IDENTITY SCHEMA
-- users table
create table identity.users (
	id varchar(50) primary key not null,
	auth_provider VARCHAR(50) NOT NULL,
	auth_provider_id VARCHAR(255) unique NOT NULL,
	email varchar(255) unique not null,
	first_name varchar(25) not null,
	last_name varchar(25) not null,
	middle_name varchar(25),
	phone_number varchar(25) not null,
	status identity.user_status NOT NULL,
	created_at TIMESTAMPTZ NOT NULL,
	updated_at TIMESTAMPTZ
);

-- invite table
create table identity.invites (
	id varchar(50) primary key not null,
	email varchar(255) not null,
	unit_id varchar(50) REFERENCES identity.organizational_units(id) not null,
	office_id varchar(50) REFERENCES identity.offices(id) not null,
	designation_id varchar(50) REFERENCES identity.designations(id) not null,
    employment_type identity.employment_type NOT NULL,
    invited_by varchar(50) REFERENCES identity.staff(id) NOT NULL,
    token TEXT,
    is_used BOOLEAN default false,
    expires_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    status identity.invite_status NOT NULL,
	created_at TIMESTAMPTZ NOT NULL,
	updated_at TIMESTAMPTZ
);

-- onboarding session
CREATE TABLE identity.onboarding_sessions (
    id VARCHAR(50) PRIMARY KEY,
    invite_id VARCHAR(50) REFERENCES identity.invites(id) UNIQUE NOT NULL,

    email VARCHAR(255) NOT NULL,

    -- step tracking
    current_step INT NOT NULL DEFAULT 1,

    -- partial data storage
    primary_data JSONB,
    profile_picture_media_id VARCHAR(50) REFERENCES media.media_assets(id),
    signature_media_id VARCHAR(50) REFERENCES media.media_assets(id),

    status identity.onboarding_session_status NOT NULL,

    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- organizational units table
CREATE TABLE identity.organizational_units(
	id varchar(50) PRIMARY KEY,
	code VARCHAR(50),
	full_name VARCHAR(150) NOT NULL,
	description TEXT NOT NULL,
	sector identity.org_unit_sector NOT NULL,
    parent_id varchar(50) REFERENCES identity.organizational_units(id),
	created_at TIMESTAMPTZ NOT NULL,
	updated_at TIMESTAMPTZ
)

-- offices table
CREATE TABLE identity.offices(
	id VARCHAR(50) PRIMARY KEY,
	name VARCHAR(150) NOT NULL,
	unit_id VARCHAR(50) REFERENCES identity.organizational_units(id),
	created_at TIMESTAMPTZ NOT NULL,
	updated_at TIMESTAMPTZ
);

-- designations table (this comes directly from the organogram)
CREATE TABLE identity.designations(
	id VARCHAR(50) PRIMARY KEY,
	title VARCHAR(150) NOT NULL,
	description TEXT,
	office_id VARCHAR(50) REFERENCES identity.offices(id),
	created_at TIMESTAMPTZ NOT NULL,
	updated_at TIMESTAMPTZ 
);

-- table allows same designation in different units to have different hierarchy_level
CREATE TABLE identity.office_designations(
    id VARCHAR(50) PRIMARY KEY,
    office_id VARCHAR(50) REFERENCES identity.offices(id) ON DELETE CASCADE,
    designation_id VARCHAR(50) REFERENCES identity.designations(id),
    hierarchy_level INTEGER NOT NULL, 
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ,
    
    UNIQUE(office_id, designation_id) -- prevents duplicate designations in the same office
);

-- staff table
CREATE TABLE identity.staff(
	id varchar(50) PRIMARY KEY,
	identity_id varchar(50) UNIQUE REFERENCES identity.users(id),
	staff_number integer UNIQUE NOT NULL,
	employment_type identity.employment_type NOT NULL,
	unit_id varchar(50) references identity.organizational_units(id),
	office_id VARCHAR(50) references identity.offices(id),
	designation_id VARCHAR(50) REFERENCES identity.designations(id),
	status identity.user_status not null,
	created_at TIMESTAMPTZ NOT NULL,
	created_by VARCHAR(50) REFERENCES identity.staff(id),
	activated_by VARCHAR(50) REFERENCES identity.staff(id),
	acivated_at TIMESTAMPTZ,
	updated_at TIMESTAMPTZ,

    CONSTRAINT fk_staff_office_designation 
        FOREIGN KEY (office_id, designation_id) 
        REFERENCES identity.office_designations(office_id, designation_id)
);

-- staff reporting line
CREATE TABLE identity.staff_reporting_lines (
    id VARCHAR(50) PRIMARY KEY,
    staff_id VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
    supervisor_id VARCHAR(50) NOT NULL REFERENCES identity.staff(id),

    type VARCHAR(30) NOT NULL, 
    -- 'PRIMARY', 'DELEGATED'

    delegated_by VARCHAR(50) REFERENCES identity.staff(id),

    effective_from TIMESTAMPTZ NOT NULL,
    effective_to TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL
);

-- capability class
CREATE TABLE identity.capability_classes(
    id varchar(50) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category identity.capability_class_category NOT NULL,     
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE identity.designation_capability_defaults (
    designation_id VARCHAR(50) 
        REFERENCES identity.designations(id),
    capability_class_id VARCHAR(50) 
        REFERENCES identity.capability_classes(id),
    PRIMARY KEY (designation_id)
);

-- staff classification
CREATE TABLE identity.staff_classifications(
	id varchar(50) PRIMARY KEY,
	staff_id varchar(50) REFERENCES identity.staff(id),
	capability_class_id VARCHAR(50) REFERENCES identity.capability_classes(id),
	authority_level INTEGER NOT NULL,
	effective_from DATE NOT NULL,
	effective_to DATE,
	created_at TIMESTAMPTZ NOT NULL,
	updated_at TIMESTAMPTZ
);

-- permissions table
CREATE TABLE identity.permissions(
	id varchar(50) PRIMARY KEY,
	code VARCHAR(100) UNIQUE NOT NULL,
	description TEXT
);

-- roles table
CREATE TABLE identity.roles(
	id varchar(50) PRIMARY KEY,
	name VARCHAR(100) UNIQUE NOT NULL,
	created_at TIMESTAMPTZ NOT NULL
);

-- roles-permissions table
CREATE TABLE identity.role_permissions(
    role_id varchar(50) REFERENCES identity.roles(id),
    permission_id varchar(50) REFERENCES identity.permissions(id),
    PRIMARY KEY (role_id, permission_id)
)

CREATE TABLE identity.capability_role_mappings (
    capability_class_id VARCHAR(50) 
        REFERENCES identity.capability_classes(id),
    role_id VARCHAR(50) 
        REFERENCES identity.roles(id),
    PRIMARY KEY (capability_class_id, role_id)
);

-- role assignments
CREATE TABLE identity.role_assignments(
	id varchar(50) PRIMARY KEY,
	staff_id varchar(50) REFERENCES identity.staff(id),
	role_id varchar(50) REFERENCES identity.roles(id),
	scope JSONB, -- e.g { unitId: '...', officeId: '...' }
	delegated_by varchar(50) REFERENCES identity.staff(id),
    source identity.role_assignments_source not null,
	valid_from TIMESTAMPTZ NOT NULL,
	valid_to TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL
);

-- staff media
CREATE TABLE identity.staff_media_assets (
    staff_id VARCHAR(50) REFERENCES identity.staff(id) ON DELETE CASCADE NOT NULL,
    media_id VARCHAR(50) REFERENCES media.media_assets(id) ON DELETE CASCADE NOT NULL,

    asset_role VARCHAR(50) NOT NULL, 
    -- e.g. PROFILE_PICTURE, SIGNATURE,
    is_active BOOLEAN DEFAULT FALSE,

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (staff_id, media_id),
    CONSTRAINT unique_staff_media UNIQUE (staff_id, media_id)
);

-- failure records
CREATE TABLE identity.staff_activation_failures (
    id VARCHAR(70) PRIMARY KEY,
    staff_id VARCHAR(50)
        REFERENCES identity.staff(id) NOT NULL,

	previous_staff_id VARCHAR(50) REFERENCES identity.staff(id),
	handed_over_at TIMESTAMPTZ,
    invite_id VARCHAR(50)
        REFERENCES identity.invites(id) NOT NULL,
    failure_stage VARCHAR(100) NOT NULL,
    failure_reason TEXT NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    retry_count INTEGER NOT NULL DEFAULT 0,

    first_failed_at TIMESTAMPTZ NOT NULL,
    last_failed_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ
);
CREATE TABLE identity.recovery_tasks (
    id VARCHAR(50) PRIMARY KEY,
    task_type identity.recovery_task_type NOT NULL,
    -- staff id / invite id / user id
    entity_id VARCHAR(50) NOT NULL,

    payload JSONB NOT NULL,
    error_message TEXT NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,

    status identity.recovery_task_status NOT NULL DEFAULT 'pending',
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL
);

-- MEDIA SCHEMA
-- media-assets
CREATE TABLE media.media_assets (
    id VARCHAR(50) PRIMARY KEY,

    storage_provider VARCHAR(50) NOT NULL, 
    -- e.g. LOCAL, S3, AZURE

    bucket_name VARCHAR(100),
    object_key VARCHAR(255) NOT NULL,
    format VARCHAR(5) NOT NULL,

    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    checksum VARCHAR(255) NOT NULL, -- SHA-256 recommended

    uploaded_at TIMESTAMPTZ NOT NULL,
    uploaded_by VARCHAR(50) NOT NULL,
    uploaded_by_type media.uploaded_by_type NOT NULL
);


-- DOCUMENTS SCHEMA
-- documents types
CREATE TABLE document.document_type (
    id VARCHAR(50) PRIMARY KEY,
    code varchar(10) UNIQUE NOT NULL,
    name varchar(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ
);

-- documents volumes
CREATE TABLE document.correspondence_subjects (
    id VARCHAR(50) PRIMARY KEY,
    code varchar(10) UNIQUE NOT NULL,
    name varchar(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ
);

CREATE TABLE document.business_functions (
    id VARCHAR(50) PRIMARY KEY,
    subject_id VARCHAR(50) REFERENCES document.correspondence_subjects(id) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ
);

-- ref number
CREATE TABLE document.reference_sequences (
    year INT NOT NULL,
    origin_unit_id varchar(50) REFERENCES identity.organizational_units NOT NULL,
    recipient_unit_id varchar(50) REFERENCES identity.organizational_units,
    subject_code varchar(50) REFERENCES document.correspondence_subjects(code) NOT NULL,
    function_code varchar(50) REFERENCES document.business_functions(code) NOT NULL,
    current_value INT NOT NULL,
    UNIQUE(year, origin_unit_id, recipient_code, subject_code, function_code)
);

CREATE TABLE document.documents (
    id VARCHAR(50) PRIMARY KEY,

    -- core
    title VARCHAR(200) NOT NULL,
    owner_id varchar(50) REFERENCES identity.staff(id) NOT NULL,
    reference_number VARCHAR(50),

	-- version data
	current_version_id varchar(50),

    -- correspondence metadata
    originating_unit_id varchar(50) REFERENCES identity.organizational_units(id) NOT NULL,
    subject_code_id varchar(50) REFERENCES document.correspondence_subjects(id) NOT NULL,
    direction document.correspondence_direction NOT NULL,

    -- classification metadata
    sensitivity policy.document_sensitivity_level NOT NULL,
	governance_policy_key VARCHAR(100) NOT NULL,
	governance_policy_version INT NOT NULL CHECK(governance_policy_version > 0),
    business_function_id varchar(50) REFERENCES document.business_functions(id) NOT NULL,
    document_type_id varchar(50) REFERENCES document.document_type(id) NOT NULL,

    classified_by varchar(50) REFERENCES identity.staff(id) NOT NULL,
    classified_at TIMESTAMPTZ NOT NULL,

    last_reclassified_at TIMESTAMPTZ,
    last_reclassified_by varchar(50) REFERENCES identity.staff(id),

    -- retention metadata
    policy_version INT NOT NULL,
    retention_schedule_id VARCHAR(50) REFERENCES policy.document_retention(id) NOT NULL,
    retention_start_date TIMESTAMPTZ NOT NULL,
    disposal_eligibility_date TIMESTAMPTZ NOT NULL,
    archival_required BOOLEAN NOT NULL,

    -- audit sake
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- documents versions
CREATE TABLE document.document_versions (
    id VARCHAR(50) PRIMARY KEY,
    document_id varchar(50) REFERENCES document.documents(id)  ON DELETE CASCADE NOT NULL,
    version_number INT NOT NULL,

    content_delta JSONB NOT NULL,

    media_id varchar(50) REFERENCES media.media_assets(id) NULL,
    created_at TIMESTAMPTZ NOT NULL,
    created_by varchar(50) REFERENCES identity.staff(id) NOT NULL,
    lifecycle_state document.lifecycle_state NOT NULL,

    state_entered_at TIMESTAMPTZ NOT NULL,
    state_entered_by VARCHAR(50) 
    REFERENCES identity.staff(id) NOT NULL
);

-- MUST RUN TO ENFORCE FOREIGN KEY CONSTRAINT BETWEEN document.documents and document.document_versions
ALTER TABLE document.documents
ADD CONSTRAINT fk_document_version
FOREIGN KEY (current_version_id)
REFERENCES document.document_versions(id)
ON DELETE SET NULL;

-- documents lifecycle history
CREATE TABLE document.document_lifecycle_history (
    id VARCHAR(50) PRIMARY KEY,

    document_id VARCHAR(50) NOT NULL REFERENCES document.documents(id),
    document_version_id VARCHAR(50) REFERENCES document.document_versions(id),

    from_state document.lifecycle_state,
    to_state document.lifecycle_state NOT NULL,

    action document.lifecycle_actions NOT NULL,

    actor_id VARCHAR(50) NOT NULL REFERENCES identity.staff(id),

    metadata JSONB, -- optional (reason, comments, etc.)

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- documents addressee
CREATE TABLE document.document_addressee (
    document_id varchar(50) REFERENCES document.documents(id) NOT NULL,
    recipient_unit_id varchar(50) REFERENCES identity.organizational_units(id) NOT NULL,
    addressed_to_designation_id varchar(50) REFERENCES identity.designations(id) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    PRIMARY KEY (document_id, recipient_unit_id, addressed_to_designation_id)
);

-- documents media
CREATE TABLE document.document_media_assets (
    document_id VARCHAR(50) REFERENCES document.documents(id) ON DELETE CASCADE NOT NULL,
    document_version_id VARCHAR(50) REFERENCES document.document_versions(id) ON DELETE CASCADE,
    media_id VARCHAR(50) REFERENCES media.media_assets(id) ON DELETE CASCADE NOT NULL,
    
    asset_role VARCHAR(50) NOT NULL, 
    -- e.g. PRIMARY_CONTENT, ATTACHMENT

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (document_id, media_id)
);

-- Effective digital authorization used by governance rules for internal attachments.
CREATE TABLE document.document_unit_head_signatures (
	id VARCHAR(80) PRIMARY KEY,
	document_id VARCHAR(50) NOT NULL REFERENCES document.documents(id) ON DELETE CASCADE,
	signed_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	revoked_by VARCHAR(50) REFERENCES identity.staff(id),
	revoked_at TIMESTAMPTZ,
	revocation_reason TEXT
);

-- documents minutes
CREATE TABLE document.minutes (
    id VARCHAR(50) PRIMARY KEY,

    document_id VARCHAR(50)
        REFERENCES document.documents(id)
        ON DELETE CASCADE NOT NULL,

    inbox_entry_id VARCHAR(50)
        REFERENCES dispatch.inbox_entries(id),

    author_staff_id VARCHAR(50)
        REFERENCES identity.staff(id)
        NOT NULL,

    parent_minute_id VARCHAR(50)
        REFERENCES document.minutes(id),

    action document.minute_action NOT NULL,

    content TEXT DEFAULT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- makes attachments on docs possible
CREATE TABLE document.document_relationships (
    id VARCHAR(50) PRIMARY KEY,

    source_document_id VARCHAR(50)
        REFERENCES document.documents(id),

    target_document_id VARCHAR(50)
        REFERENCES document.documents(id),

    relationship_type document.relationship_type NOT NULL,

    created_by VARCHAR(50)
        REFERENCES identity.staff(id),

    created_at TIMESTAMPTZ NOT NULL
);

-- DISPATCH SCHEMA
CREATE TABLE dispatch.dispatch_records (
    id VARCHAR(50) PRIMARY KEY,

    document_id VARCHAR(50)
        REFERENCES document.documents(id)
        ON DELETE CASCADE NOT NULL,

    -- sender (for accountability sake)
    sender_staff_id VARCHAR(50)
        REFERENCES identity.staff(id) NOT NULL,
    sender_designation_id VARCHAR(50) REFERENCES identity.designations(id),
    sender_unit_id VARCHAR(50)
        REFERENCES identity.organizational_units(id) NOT NULL,

    -- recipient (policy-based routing)
    recipient_designation_id VARCHAR(50) REFERENCES identity.designations(id),
    recipient_unit_id VARCHAR(50) REFERENCES identity.organizational_units(id) NOT NULL,

    -- dispatch metadata
    dispatch_type dispatch.dispatch_type NOT NULL,
    status dispatch.status NOT NULL,

    dispatched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    parent_dispatch_id VARCHAR(50)
        REFERENCES dispatch.dispatch_records(id)
);

CREATE TABLE dispatch.inbox_entries (
    id VARCHAR(50) PRIMARY KEY,

    dispatch_id VARCHAR(50)
        REFERENCES dispatch.dispatch_records(id)
        ON DELETE CASCADE NOT NULL,

    document_id VARCHAR(50)
        REFERENCES document.documents(id)
        ON DELETE CASCADE NOT NULL,

    -- actual recipient (resolved from designation)
    staff_id VARCHAR(50)
        REFERENCES identity.staff(id) NOT NULL,

    -- context snapshot
    designation_id VARCHAR(50) REFERENCES identity.designations(id) NOT NULL,
    unit_id VARCHAR(50) REFERENCES identity.organizational_units(id) NOT NULL,

    -- state
    status dispatch.inbox_entry_status NOT NULL DEFAULT 'unread', 

    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,

    UNIQUE (dispatch_id, staff_id)
);


-- POLICY SCHEMA
CREATE TABLE policy.document_retention (
    id VARCHAR(50) PRIMARY KEY,
    policy_version INT NOT NULL,
    document_type_id varchar(50) REFERENCES document.document_type(id) NOT NULL,
    archival_required BOOLEAN NOT NULL,
    retention_duration INT NOT NULL,
    effective_from DATE NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

	UNIQUE(document_type_id, policy_version),
	UNIQUE(document_type_id, effective_from),
	CHECK(policy_version > 0),
	CHECK(retention_duration > 0)
);

CREATE TABLE policy.document_retention_version_counters (
	document_type_id VARCHAR(50) PRIMARY KEY
		REFERENCES document.document_type(id) ON DELETE CASCADE,
	last_version INT NOT NULL CHECK(last_version > 0)
);

CREATE TABLE policy.document_governance_policies (
	id VARCHAR(80) PRIMARY KEY,
	policy_key VARCHAR(100) NOT NULL,
	policy_version INT NOT NULL CHECK(policy_version > 0),
	schema_version INT NOT NULL CHECK(schema_version > 0),
	status policy.document_governance_policy_status NOT NULL DEFAULT 'draft',
	effective_from TIMESTAMPTZ NOT NULL,
	effective_to TIMESTAMPTZ,
	definition_checksum CHAR(64) NOT NULL CHECK(
		definition_checksum ~ '^[0-9a-fA-F]{64}$'
	),
	created_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	approved_by VARCHAR(50) REFERENCES identity.staff(id),
	approval_reason TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	approved_at TIMESTAMPTZ,
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK(
		jsonb_typeof(metadata) = 'object'
	),
	UNIQUE(policy_key, policy_version),
	CHECK(effective_to IS NULL OR effective_to > effective_from),
	CHECK(
		status = 'draft'
		OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)
	)
);

CREATE TABLE policy.document_governance_rules (
	id VARCHAR(80) PRIMARY KEY,
	governance_policy_id VARCHAR(80) NOT NULL
		REFERENCES policy.document_governance_policies(id) ON DELETE CASCADE,
	sensitivity policy.document_sensitivity_level,
	action VARCHAR(80) NOT NULL,
	effect policy.document_governance_rule_effect NOT NULL,
	conditions JSONB NOT NULL DEFAULT '{}'::JSONB CHECK(
		jsonb_typeof(conditions) = 'object'
	),
	obligations TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
	reason_code VARCHAR(120) NOT NULL,
	priority INT NOT NULL DEFAULT 100 CHECK(priority >= 0),
	created_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE policy.document_governance_grants (
	id VARCHAR(80) PRIMARY KEY,
	document_id VARCHAR(50) NOT NULL REFERENCES document.documents(id) ON DELETE CASCADE,
	grantee_staff_id VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	grant_type VARCHAR(30) NOT NULL,
	granted_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	grantor_authority VARCHAR(30) NOT NULL,
	reason TEXT NOT NULL,
	valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	valid_to TIMESTAMPTZ,
	remaining_uses INT,
	revoked_by VARCHAR(50) REFERENCES identity.staff(id),
	revoked_at TIMESTAMPTZ,
	revocation_reason TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE policy.document_sensitivity_change_requests (
	id VARCHAR(80) PRIMARY KEY,
	document_id VARCHAR(50) NOT NULL REFERENCES document.documents(id) ON DELETE CASCADE,
	from_sensitivity policy.document_sensitivity_level NOT NULL,
	to_sensitivity policy.document_sensitivity_level NOT NULL,
	requested_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	reason TEXT NOT NULL,
	status VARCHAR(20) NOT NULL,
	reviewed_by VARCHAR(50) REFERENCES identity.staff(id),
	review_reason TEXT,
	requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	reviewed_at TIMESTAMPTZ,
	applied_at TIMESTAMPTZ
);

ALTER TABLE document.documents
	ADD CONSTRAINT documents_governance_policy_version_fk
	FOREIGN KEY (governance_policy_key, governance_policy_version)
	REFERENCES policy.document_governance_policies(policy_key, policy_version);

CREATE TABLE policy.approval_workflow_steps (
    id VARCHAR(50) PRIMARY KEY,
    policy_version INT NOT NULL,
    document_type_id VARCHAR(50)
        REFERENCES document.document_type(id)
        NOT NULL,

    step_order INT NOT NULL,

    role_id VARCHAR(50)
        REFERENCES identity.roles(id)
        NOT NULL,

    resolution_strategy policy.resolution_strategy NOT NULL,

    -- optional but useful
    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (document_type_id, policy_version, step_order)
);


-- WORKFLOW SCHEMA
CREATE TABLE workflow.workflow_instances (
    id VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50) REFERENCES document.documents(id) ON DELETE CASCADE,

    current_step INT NOT NULL,
    status workflow.instance_status NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE workflow.workflow_tasks (
    id VARCHAR(50) PRIMARY KEY,

    workflow_instance_id VARCHAR(50)
        REFERENCES workflow.workflow_instances(id)
        ON DELETE CASCADE,

    step_order INT NOT NULL,

    assigned_to VARCHAR(50)
        REFERENCES identity.staff(id),

    minute_id VARCHAR(50)
        REFERENCES document.minutes(id),

    role VARCHAR(100) NOT NULL,

    status workflow.task_status NOT NULL, 

    acted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- DIRECTIVES SCHEMA
CREATE TABLE directive.directives (
    id VARCHAR(50) PRIMARY KEY,

    heading TEXT NOT NULL,
    instruction TEXT NOT NULL,

    issued_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),

    priority directive.priority NOT NULL,
    registry_volume directive.registry_volume NOT NULL,

    status directive.status NOT NULL DEFAULT 'draft',

    issued_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE directive.directive_staff_recipients (
    id VARCHAR(50) PRIMARY KEY,

    directive_id VARCHAR(50)
        REFERENCES directive.directives(id)
        ON DELETE CASCADE
        NOT NULL,

    staff_id VARCHAR(50)
        REFERENCES identity.staff(id)
        NOT NULL,

    seen_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (directive_id, staff_id)
);

CREATE TABLE directive.directive_unit_targets (
    id VARCHAR(50) PRIMARY KEY,

    directive_id VARCHAR(50)
        REFERENCES directive.directives(id)
        ON DELETE CASCADE
        NOT NULL,

    unit_id VARCHAR(50)
        REFERENCES identity.organizational_units(id)
        NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (directive_id, unit_id)
);

CREATE TABLE directive.directive_office_targets (
    id VARCHAR(50) PRIMARY KEY,

    directive_id VARCHAR(50)
        REFERENCES directive.directives(id)
        ON DELETE CASCADE
        NOT NULL,

    office_id VARCHAR(50)
        REFERENCES identity.offices(id)
        NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (directive_id, office_id)
);

CREATE TABLE directive.directive_role_targets (
    id VARCHAR(50) PRIMARY KEY,

    directive_id VARCHAR(50)
        REFERENCES directive.directives(id)
        ON DELETE CASCADE
        NOT NULL,

    role_id VARCHAR(50)
        REFERENCES identity.roles(id)
        NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (directive_id, role_id)
);


-- NOTIFICATIONS SCHEMA
CREATE TABLE notifications.notifications (
    id VARCHAR(50) PRIMARY KEY,

    recipient_id varchar(50) NOT NULL,
    recipient_type notifications.recipient_type NOT NULL,

    event_type varchar(100) NOT NULL,
    subject_type varchar(50) NOT NULL,
    subject_id varchar(50) NOT NULL,
    
    in_app_subject_name varchar(255) DEFAULT NULL,
    email_subject_header varchar(255) DEFAULT NULL,

    message_template TEXT NOT NULL,

    payload JSONB,

    channel notifications.preference NOT NULL,

    priority notifications.priority NOT NULL,

    state notifications.state NOT NULL,

    retry_count INT DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ
);
