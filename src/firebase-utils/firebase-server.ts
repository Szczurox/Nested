import "server-only";

import * as adm from "firebase-admin";

export const getAdmin = () => {
	if (adm.apps.length <= 0) {
		const admin = adm.initializeApp({
			credential: adm.credential.cert({
				projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
				clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
				privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(
					/\\n/g,
					"\n"
				),
			}),
		});

		return admin;
	} else return adm.apps[0];
};
