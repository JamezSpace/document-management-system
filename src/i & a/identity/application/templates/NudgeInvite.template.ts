function generateUnstartedNudgeTemplate(link: string) {
    return `Good day,

This is a formal reminder regarding your pending registration on the Nexus-Fons Registry. Our records indicate that your account has not yet been activated.

To ensure uninterrupted access to the University of Ibadan’s digital infrastructure and your departmental governance tools, please complete your onboarding at your earliest convenience:

Activate Your Digital Office
${link}

Please note that this invitation link is temporary. If it has expired, you may need to request a new provisioning token from the ITCC support team.

Sincerely,
Nexus-Fons Administration
The Digital Office: Authority in Every Action.
`;
}

function generateIncompleteOnboardingNudgeTemplate(link: string) {
    return `Good day,

Our system shows that your onboarding process for the Nexus-Fons Registry is currently incomplete.

Your digital office remains in a "Provisioned" state and is not yet fully active. To finalize your credentials and secure your access to departmental services, please return to the onboarding portal to complete the remaining steps:

Resume Onboarding Process
${link}

If you are experiencing technical difficulties or require clarification on a specific step, please reach out to itcc@ui.edu.ng for assistance.

Sincerely,
Nexus-Fons Administration
The Digital Office: Authority in Every Action.
`;
}

export {generateIncompleteOnboardingNudgeTemplate, generateUnstartedNudgeTemplate};