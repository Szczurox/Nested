import { NextApiResponse, NextApiRequest } from "next";
import { getAdmin } from "global-utils/firebase-server";

export default async function GET(req: NextApiRequest, res: NextApiResponse) {
	if (req.method === "POST") {
		const admin = getAdmin()!;
		const db = admin?.firestore()!;

		const group: string = req.query.group as string;
		const channel: string = req.query.channel as string;
		const token: string = req.headers.authorization as string;

		if (!group || !channel)
			return res.status(400).send({
				error: `Missing query parameter`,
			});

		if (!token)
			return res.status(400).send({
				error: "Missing authorization token",
			});

		// Verify that user is authenticated
		const decodedToken = await admin.auth().verifyIdToken(token);

		// Verify that user can join this channel
		const docRef = db
			.collection("groups")
			.doc(group)
			.collection("channels")
			.doc(channel)
			.collection("participants")
			.doc(decodedToken.uid);

		// Sign JWT token and return it to client
		try {
			await docRef.update({ connected: "disconnected" });
		} catch {
			return res.status(400).send({
				error: "Unauthorized",
			});
		}

		return res.json({
			disconnected: true,
		});
	}
}
