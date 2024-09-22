import { NextApiResponse, NextApiRequest } from "next";
import { getAdmin } from "global-utils/firebase-server";
import jwt from "jsonwebtoken";

export default async function GET(req: NextApiRequest, res: NextApiResponse) {
	if (req.method === "GET") {
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

		const decodedToken = await admin.auth().verifyIdToken(token);

		const doc = await db
			.collection("groups")
			.doc(group)
			.collection("channels")
			.doc(channel)
			.collection("participants")
			.doc(decodedToken.uid)
			.get();

		if (!doc.exists || !doc.data())
			return res.status(400).send({
				error: "Unauthorized",
			});

		if (decodedToken) {
			const token = jwt.sign(
				{
					uid: decodedToken.uid,
					username: doc.data()!.nickname,
					avatar: doc.data()!.avatar,
					channel: channel,
					group: group,
				},
				process.env.SOCKET_SECRET_KEY!,
				{}
			);

			return res.json({
				token: token,
			});
		}
	}
}
