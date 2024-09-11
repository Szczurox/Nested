import { AccessToken } from "livekit-server-sdk";
import { NextApiResponse, NextApiRequest } from "next";

export default async function GET(req: NextApiRequest, res: NextApiResponse) {
	const room: string = req.query.room as string;
	const username: string = req.query.username as string;

	if (!room) {
		return res.status(400).send({
			error: 'Missing "room" query parameter',
		});
	} else if (!username) {
		return res.status(400).send({
			error: 'Missing "user" query parameter',
		});
	}

	const apiKey = process.env.LIVEKIT_API_KEY;
	const apiSecret = process.env.LIVEKIT_API_SECRET;
	const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

	console.log(apiKey, apiSecret, wsUrl);

	if (!apiKey || !apiSecret || !wsUrl) {
		return res.status(500).send({
			error: "Server misconfigured",
		});
	}

	const at = new AccessToken(apiKey, apiSecret, { identity: username });

	at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });

	return res.json({ token: await at.toJwt(), room: room });
}
