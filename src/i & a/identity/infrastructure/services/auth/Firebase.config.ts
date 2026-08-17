import type {ServiceAccount } from "firebase-admin";
import { cert, initializeApp } from "firebase-admin/app";

const serviceAccount: ServiceAccount = {
    clientEmail: process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
    projectId: process.env.FIREBASE_SERVICE_ACCOUNT_PROJECT_ID!
}

const firebaseApp = initializeApp({
    credential: cert(serviceAccount)
})

export default firebaseApp;
