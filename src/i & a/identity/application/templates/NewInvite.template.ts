function generateNewInviteTemplate(link: string) {
    return `Good day,

You have been registered on the Nexus-Fons Registry, the University of Ibadan’s unified digital infrastructure for secure departmental governance.

Your account has been provisioned by the appropriate authority. To activate your digital office and establish your secure access credentials, you are required to complete the onboarding process.

Please proceed using the link below:

Set Your Password / Activate Account
${link}

This link is time-bound and intended for your use only. For security reasons, do not share this link with any third party.

If you encounter any issues or notice discrepancies in your information, please contact the ITCC support team immediately at:
itcc@ui.edu.ng

Failure to complete this process may delay your access to departmental systems and services.

We welcome you to the Nexus-Fons Registry.

Sincerely,
Nexus-Fons Administration
The Digital Office: Authority in Every Action.
`
}

export { generateNewInviteTemplate };
