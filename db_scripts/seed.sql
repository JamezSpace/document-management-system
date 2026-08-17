-- staff
INSERT INTO identity.staff 
VALUES 
	('staff.system', NULL, 0, 'permanent', NULL, NULL, NULL, 'active', NOW(), 'staff.system', 'staff.system', NOW());
	-- add hr record and staff activator with reference to 'staff.system' as created_by


-- capability class
INSERT INTO identity.capability_class
VALUES 
    ('CC-019cc298-857f-76ca-b4c8-ce11cb271a19', 'unit head', 'leadership', 'The senior authority responsible for the direction, accountability, and final approval of activities within a unit or office. The Unit Head may authorize major decisions, approve critical documents, and represent the unit in institutional governance processes.', '2026-03-06 11:01:41.503075+01'),
    ('CC-019cc298-fe2d-7471-9d9b-f20f87ad6cbf', 'deputy unit head', 'leadership', 'The secondary authority within a unit who assists the Unit Head in supervisory duties. The Deputy Unit Head may review documents, coordinate operational activities, and act with delegated authority when the Unit Head is unavailable.', '2026-03-06 11:02:12.397089+01'),
    ('CC-019cc29a-8600-712f-9fc3-15944310bc6e', 'reviewing officer', 'professional officers', 'A professional staff member responsible for evaluating documents, reports, or submissions for correctness, completeness, and policy compliance before they proceed to approval. Reviewing Officers ensure that documents meet institutional standards and may recommend revisions.', '2026-03-06 11:03:52.70336+01'),
    ('CC-019cc29a-f81a-73a6-801b-85b4f0bc52d6', 'processing officer', 'professional officers', 'A staff member responsible for preparing, organizing, and processing documents through operational workflows. Processing Officers handle document intake, drafting, formatting, and routing to appropriate reviewers or authorities.', '2026-03-06 11:04:21.913947+01'),
    ('CC-019cc29b-9005-76cc-bfb1-33da64b852df', 'coordinating officer', 'professional officers', 'An officer responsible for coordinating document movement and communication between multiple units, offices, or stakeholders. The Coordinating Officer ensures that required participants are engaged and that processes progress according to workflow procedures.', '2026-03-06 11:05:00.805079+01'),
    ('CC-019cc29c-79ac-7408-8287-f89a09bb0228', 'records clerk', 'clerical & records', 'A staff member responsible for maintaining document records, ensuring proper filing, archiving, and retrieval. Records Clerks safeguard institutional records and ensure compliance with retention and records management policies.', '2026-03-06 11:06:00.619115+01'),
    ('CC-019cc29d-02da-7648-8cc3-53b5cf083cd5', 'documentation assistant', 'clerical & records', 'A support staff member responsible for assisting with document preparation, formatting, digitization, and record organization. Documentation Assistants support operational staff in maintaining accurate and accessible documentation.', '2026-03-06 11:06:35.738225+01'),
    ('CC-019cc29d-7b97-7ea6-988b-1b152b3a5576', 'office secretary', 'clerical & records', 'An administrative staff member responsible for managing office correspondence, scheduling, and routine documentation tasks. The Office Secretary facilitates communication within the office and assists in maintaining orderly administrative records.', '2026-03-06 11:07:06.647516+01'),
    ('CC-019cc29e-3b53-7b0e-8826-69a2719236e3', 'administrative support staff', 'operational support', 'Personnel who provide general administrative assistance across office functions, including document handling, logistics coordination, and routine operational support necessary for day-to-day office activities.', '2026-03-06 11:07:55.731475+01'),
    ('CC-019cc29e-aea8-7e6b-baa3-9322a9629222', 'facilities & logistics liaison', 'operational support', 'A staff member responsible for coordinating operational logistics, facilities-related documentation, and support requests between offices and institutional service departments. This role ensures that logistical processes and supporting documentation move efficiently across units.', '2026-03-06 11:08:25.256612+01'),



-- permissions data
INSERT INTO identity.permissions
VALUES 
    ('perm.document.create','document.create','create new document'),
    ('perm.document.update','document.update','edit draft document'),
    ('perm.document.view','document.view','view document'),
    ('perm.document.delete','document.delete','delete document'),
    ('perm.document.submit','document.submit','submit document into workflow'),
    ('perm.document.approve','document.approve','approve document'),
    ('perm.document.reject','document.reject','reject document'),
    ('perm.document.cancel','document.cancel','cancel document'),
    ('perm.document.activate','document.activate','activate document'),
    ('perm.document.route','document.route','route document'),
    ('perm.document.assign','document.assign','assign document'),
    ('perm.document.download','document.download','download document'),
    -- workflow data
    ('perm.workflow.forward','workflow.forward','forward workflow'),
    ('perm.workflow.reassign','workflow.reassign','reassign workflow'),
    ('perm.workflow.escalate','workflow.escalate','escalate workflow'),
    -- record data 
    ('perm.record.archive','record.archive','archive record'),
    ('perm.record.transfer','record.transfer','transfer record'),
    ('perm.record.declare','record.declare','convert document to record'),
    ('perm.record.dispose','record.dispose','dispose archived record'),
    -- user data
    ('perm.user.update','user.update','update to existing user record'),
    -- staff data
    ('perm.staff.view','staff.view','view staff record'),
    ('perm.staff.list','staff.list','list staff records'),
    ('perm.staff.create','staff.create','create staff record'),
    ('perm.staff.update','staff.update','update staff record'),
    ('perm.staff.activate','staff.activate','activate staff record'),
    ('perm.staff.deactivate','staff.deactivate','deactivate staff record'),
    -- staff classification data
    ('perm.classification.assign','classification.assign','assign staff classification'),
    ('perm.classification.update','classification.update','update staff classification'),
    ('perm.classification.view','classification.view','view classification'),
    -- role assignment data
    ('perm.role.create','role.create','create roles'),
    ('perm.role.assign','role.assign','assign roles'),
    ('perm.role.remove','role.remove','remove role assigned'),
    ('perm.role.view','role.view','view role assigned'),
    ('perm.role.list','role.list','view all roles'),
    ('perm.role.delete','role.delete','delete role'),
    -- directive data
    ('perm.directive.issue','directive.issue','makes directive official and binding'),
    ('perm.directive.create','directive.create','drafts a directive but not make it official'),
    ('perm.directive.update','directive.update','update directive'),
    ('perm.directive.cancel','directive.cancel','cancel directive'),
    ('perm.directive.view','directive.view','view directive'),
    ('perm.directive.route','directive.route','assign recipients'),
    ('perm.directive.acknowledge','directive.acknowledge','recipient acknowledges directive'),
    ('perm.directive.enforce','directive.enforce','monitor compliance'),
    -- permission data
    ('perm.permission.view','permission.view','view permissions'),
    ('perm.staff.pending_activation.list',
    'staff.pending_activation.list',
    'list staff pending activation'),
    -- ui
    ('perm.notice.view', 'notice.view', 'Access the system notice board and university bulletin'),
    ('perm.registry.intake', 'registry.intake', 'register and scan incoming correspondence'),
    ('perm.registry.logbook.view', 'registry.logbook.view', 'view external correspondence register');



-- roles data
INSERT INTO identity.roles
VALUES
    ('role.sys_admin','system_admin', NOW()),
    ('role.records_manager','records_manager', NOW()),
    ('role.directive_authority','directive_authority', NOW()),
    ('role.reviewing_officer','reviewing_officer', NOW()),
    ('role.processing_officer','processing_officer', NOW()),
    ('role.records_clerk','records_clerk', NOW()),
    ('role.staff_member','staff_member', NOW()),
    ('role.staff_admin','staff_admin', NOW()),
    ('role.staff_activation_officer','staff_activation_officer', NOW()),
    ('role.workflow_coordinator','workflow_coordinator', NOW());


-- roles-permissions table
INSERT INTO identity.role_permissions
VALUES
    -- workflow coordinator
    ('role.workflow_coordinator', 'perm.workflow.forward'),
    ('role.workflow_coordinator', 'perm.workflow.reassign'),
    ('role.workflow_coordinator', 'perm.workflow.escalate'),
    ('role.workflow_coordinator', 'perm.document.view'),
    -- staff member
    ('role.staff_member', 'perm.document.view'),
    ('role.staff_member', 'perm.document.download'),
    ('role.staff_member', 'perm.directive.view'),
    ('role.staff_member', 'perm.directive.acknowledge'),
    ('role.staff_member', 'perm.notice.view'),
    -- staff admin
    ('role.staff_admin', 'perm.staff.create'),
    ('role.staff_admin', 'perm.staff.update'),
    ('role.staff_admin', 'perm.staff.view'),
    ('role.staff_admin', 'perm.staff.list'),
    ('role.staff_activation_officer', 'perm.staff.deactivate'),
    ('role.staff_admin', 'perm.classification.assign'),
    ('role.staff_admin', 'perm.classification.update'),
    ('role.staff_admin', 'perm.classification.view'),
    -- staff activation officer
    ('role.staff_activation_officer', 'perm.staff.view'),
    ('role.staff_activation_officer', 'perm.staff.activate'),
    ('role.staff_activation_officer', 'perm.staff.pending_activation.list'),
    -- records clerk
    ('role.records_clerk', 'perm.document.view'),
    ('role.records_clerk', 'perm.document.download'),
    ('role.records_clerk', 'perm.record.archive'),
    ('role.records_clerk', 'perm.record.transfer'),
    -- processing officer
    ('role.processing_officer', 'perm.document.create'),
    ('role.processing_officer', 'perm.document.view'),
    ('role.processing_officer', 'perm.document.update'),
    ('role.processing_officer', 'perm.document.download'),
    ('role.processing_officer', 'perm.document.submit'),
    ('role.processing_officer', 'perm.workflow.forward'),
    -- reviewing officer
    ('role.reviewing_officer', 'perm.document.download'),
    ('role.reviewing_officer', 'perm.document.approve'),
    ('role.reviewing_officer', 'perm.document.reject'),
    ('role.reviewing_officer', 'perm.document.view'),
    ('role.reviewing_officer', 'perm.workflow.forward'),
    ('role.reviewing_officer', 'perm.workflow.escalate'),
    -- records manager
    ('role.records_manager', 'perm.record.archive'),
    ('role.records_manager', 'perm.record.transfer'),
    ('role.records_manager', 'perm.record.dispose'),
    ('role.records_manager', 'perm.record.declare'),
    ('role.records_manager', 'perm.document.view'),
    ('role.records_manager', 'perm.document.download'),
    -- directive authority
    ('role.directive_authority', 'perm.directive.create'),
    ('role.directive_authority', 'perm.directive.update'),
    ('role.directive_authority', 'perm.directive.issue'),
    ('role.directive_authority', 'perm.directive.cancel'),
    ('role.directive_authority', 'perm.directive.view'),
    ('role.directive_authority', 'perm.directive.route'),
    -- system admin
    ('role.sys_admin', 'perm.role.create'),
    ('role.sys_admin', 'perm.role.assign'),
    ('role.sys_admin', 'perm.role.delete'),
    ('role.sys_admin', 'perm.role.list'),
    ('role.sys_admin', 'perm.permission.view'),
    ('role.sys_admin', 'perm.staff.create'),
    ('role.sys_admin', 'perm.staff.update'),
    ('role.sys_admin', 'perm.staff.activate'),
    ('role.sys_admin', 'perm.staff.deactivate');

-- capability_role_mappings
INSERT INTO identity.capability_role_mappings (capability_class_id, role_id)
VALUES 
    -- Unit Head gets high-level authority
    ('CC-019cc298-857f-76ca-b4c8-ce11cb271a19', 'role.directive_authority'),
    ('CC-019cc298-857f-76ca-b4c8-ce11cb271a19', 'role.reviewing_officer'),
    ('CC-019cc298-857f-76ca-b4c8-ce11cb271a19', 'role.staff_member'),

    -- Deputy Unit Head
    ('CC-019cc298-fe2d-7471-9d9b-f20f87ad6cbf', 'role.reviewing_officer'),
    ('CC-019cc298-fe2d-7471-9d9b-f20f87ad6cbf', 'role.workflow_coordinator'),
    ('CC-019cc298-fe2d-7471-9d9b-f20f87ad6cbf', 'role.staff_member'),

    -- Reviewing Officer
    ('CC-019cc29a-8600-712f-9fc3-15944310bc6e', 'role.reviewing_officer'),
    ('CC-019cc29a-8600-712f-9fc3-15944310bc6e', 'role.staff_member'),

    -- Processing Officer
    ('CC-019cc29a-f81a-73a6-801b-85b4f0bc52d6', 'role.processing_officer'),
    ('CC-019cc29a-f81a-73a6-801b-85b4f0bc52d6', 'role.staff_member'),

    -- Records Clerk
    ('CC-019cc29c-79ac-7408-8287-f89a09bb0228', 'role.records_clerk'),
    ('CC-019cc29c-79ac-7408-8287-f89a09bb0228', 'role.staff_member'),

    -- Admin Support / Secretary (Basic Access)
    ('CC-019cc29d-7b97-7ea6-988b-1b152b3a5576', 'role.staff_member'),
    ('CC-019cc29e-3b53-7b0e-8826-69a2719236e3', 'role.staff_member');


-- designation_capability_defaults
INSERT INTO identity.designation_capability_defaults (designation_id, capability_class_id)
VALUES 
    -- Entry to Mid-Level: Processing Officers
    ('DESIG-019c9ee6-afa7-727a-a23f-a7deafde9b28', 'CC-019cc29a-f81a-73a6-801b-85b4f0bc52d6'), -- Ind. Coord II
    ('DESIG-019c9ee7-1dba-7d65-9e7d-ec828b0476ba', 'CC-019cc29a-f81a-73a6-801b-85b4f0bc52d6'), -- Ind. Coord I
    
    -- Senior Level: Reviewing Officers
    ('DESIG-019c9ee8-2a58-752d-b86e-20296882c96a', 'CC-019cc29a-8600-712f-9fc3-15944310bc6e'), -- Senior Coord
    ('DESIG-019c9eef-bc0f-7471-a4c6-3a433df34c83', 'CC-019cc29a-8600-712f-9fc3-15944310bc6e'), -- Principal Coord
    
    -- Executive Level: Coordinating Officers
    ('DESIG-019c9ef0-0a68-7966-bdd1-7bd3d3dd2829', 'CC-019cc29b-9005-76cc-bfb1-33da64b852df'), -- Asst. Chief (Deputy Head)
    ('DESIG-019c9ef0-2444-7df9-843e-8d1c0d0ded2a', 'CC-019cc29b-9005-76cc-bfb1-33da64b852df'); -- Chief (Unit Head)

-- role assignments table
INSERT INTO identity.role_assignments VALUES (
    'ra-002',
    'staff.admin',
    'role.processing_officer',
    NULL,
    NULL,
    NOW(),
    NULL,
    NOW()
),
(
    'ra-003',
    'staff.admin',
    'role.reviewing_officer',
    NULL,
    NULL,
    NOW(),
    NULL,
    NOW()
),
(
    'ra-004',
    'staff.admin',
    'role.workflow_coordinator',
    NULL,
    NULL,
    NOW(),
    NULL,
    NOW()
),
(
    'ra-005',
    'staff.admin',
    'role.directive_authority',
    NULL,
    NULL,
    NOW(),
    NULL,
    NOW()
),
(
    'ra-006',
    'staff.admin',
    'role.staff_admin',
    NULL,
    NULL,
    NOW(),
    NULL,
    NOW()
);


-- DOCUMENTS SCHEMA
INSERT INTO document.correspondence_subjects (id, code, name, description, created_at)
VALUES 
    ('CORR-SUBJ-GOV', 'GOV', 'Governance', 'Corporate and administrative oversight', now()),
    ('CORR-SUBJ-ACA', 'ACA', 'Academic', 'Core teaching and learning functions', now()),
    ('CORR-SUBJ-HRM', 'HRM', 'Personnel', 'Staff and identity management', now()),
    ('CORR-SUBJ-FIN', 'FIN', 'Finance', 'Monetary and asset management', now());


INSERT INTO document.business_functions (id, subject_id, code, name, description, created_at)
VALUES 
    -- Governance Functions
    ('BUS-FUNC-DIR', 'CORR-SUBJ-GOV', 'DIR', 'Executive Directives', 'Official orders from the VC, Registrar, or Council.', now()),
    ('BUS-FUNC-SEN', 'CORR-SUBJ-GOV', 'SEN', 'Senate Matters', 'Correspondence regarding academic policy and decisions.', now()),
    ('BUS-FUNC-MTG', 'CORR-SUBJ-GOV', 'MTG', 'Committee Minutes', 'Records of formal board and committee meetings.', now()),
    -- Academic Functions
    ('BUS-FUNC-EXM', 'CORR-SUBJ-ACA', 'EXM', 'Examinations', 'Highly sensitive grading, results, and scripts.', now()),
    ('BUS-FUNC-ADM', 'CORR-SUBJ-ACA', 'ADM', 'Admissions', 'Processing of new student entries and registrations.', now()),
    ('BUS-FUNC-ACR', 'CORR-SUBJ-ACA', 'ACR', 'Accreditation', 'Professional body and NUC compliance records.', now()),
    -- Finance Functions
    ('BUS-FUNC-PRO', 'CORR-SUBJ-FIN', 'PRO', 'Procurement', 'Purchase orders and tender documents.', now()),
    ('BUS-FUNC-BUD', 'CORR-SUBJ-FIN', 'BUD', 'Budgeting', 'Departmental allocations and financial planning.', now()),
    ('BUS-FUNC-GNT', 'CORR-SUBJ-FIN', 'GNT', 'Research Grants', 'Management of external funding for academic research.', now()),
    -- HR Functions
    ('BUS-FUNC-REC', 'CORR-SUBJ-HRM', 'REC', 'Recruitment', 'Onboarding, internships, and staff applications.', now()),
    ('BUS-FUNC-DIS', 'CORR-SUBJ-HRM', 'DIS', 'Disciplinary', 'Queries, warnings, and tribunal records.', now()),
    ('BUS-FUNC-LEV', 'CORR-SUBJ-HRM', 'LEV', 'Disciplinary', 'Tracking of staff absences and study leaves.', now());


INSERT INTO document.document_type (id, code, name, created_at)
VALUES 
    ('DOC-TYPE-019cf626-fa21-7fe2-9d63-8b710be0a768', 'memo', 'memorandum', now())

-- POLICY SCHEMA
-- retention policy
INSERT INTO policy.document_retention (id, policy_version, document_type_id, archival_required,retention_duration, effective_from)
VALUES (
    'DOC-RET-POL-019cf628-9799-7bf5-a302-a4ed506e8d15',
    1,
    'DOC-TYPE-019cf626-fa21-7fe2-9d63-8b710be0a768',
    true,
    5,
    '2026-03-15'
)


-- MEMO approval policy (version 1)
INSERT INTO policy.approval_workflow_steps (
    id, policy_version, document_type_id,
    step_order, role_id, resolution_strategy, description
) VALUES

-- supervisor review (context-driven)
(
    'wf-step-1',
    1,
    'DOC-TYPE-019cf626-fa21-7fe2-9d63-8b710be0a768',
    1,
    'role.reviewing_officer',
    'direct_supervisor',
    'Immediate supervisor reviews and validates document'
),

-- department-level approval
(
    'wf-step-2',
    1,
    'DOC-TYPE-019cf626-fa21-7fe2-9d63-8b710be0a768',
    2,
    'role.reviewing_officer',
    'role_in_office',
    'Reviewing officer within originating unit approves'
),

-- workflow control (optional )
(
    'wf-step-3',
    1,
    'DOC-TYPE-019cf626-fa21-7fe2-9d63-8b710be0a768',
    3,
    'role.workflow_coordinator',
    'role_in_unit',
    'Workflow coordinator validates routing and compliance'
),

-- final authority approval
(
    'wf-step-4',
    1,
    'DOC-TYPE-019cf626-fa21-7fe2-9d63-8b710be0a768',
    4,
    'role.directive_authority',
    'role_in_unit',
    'Final approval by directive authority'
);