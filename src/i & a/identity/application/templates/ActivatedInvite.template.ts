function generateActivationSuccessTemplate(loginLink: string) {
    return `Good day,

Congratulations. Your onboarding process is complete, and your account on the Nexus-Fons Registry has been successfully activated.

You now have full access to the University of Ibadan’s unified digital infrastructure. Your digital office is officially established, granting you the secure access required for departmental governance and administrative actions.

You may now access the registry using the portal below:

Access Nexus-Fons Registry
${loginLink}

As a registered staff member, please ensure you adhere to the university's digital security protocols. Your credentials are your signature within the system; keep them secure at all times.

If you have any questions regarding your assigned permissions or system features, please refer to the documentation within the portal or contact the ITCC support team at itcc@ui.edu.ng.

Welcome to the future of departmental governance.

Sincerely,
Nexus-Fons Administration
The Digital Office: Authority in Every Action.
`
}

export { generateActivationSuccessTemplate }