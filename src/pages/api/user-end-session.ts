import { getAdmin } from "firebase-utils/firebase-server";
import { NextApiRequest, NextApiResponse } from "next";

const admin = getAdmin()!;
const db = admin?.firestore()!;

interface EndSessionHandlerBody {
  guildId: string;
  channelId: string;
}

export default async function userEndSessionHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.headers.authorization!;
  const decodedToken = await admin.auth().verifyIdToken(token)!;
  const body: EndSessionHandlerBody = JSON.parse(req.body);

  console.log("user went offline");

  await db
    .collection("profile")
    .doc(decodedToken.uid)
    .update({ isActive: false });

  if (body.channelId != "")
    await db
      .collection("groups")
      .doc(body.guildId)
      .collection("channels")
      .doc(body.channelId)
      .collection("participants")
      .doc(decodedToken.uid)
      .update({ isTyping: false });

  res.status(200).json({ uid: token, id: body.channelId });
}
