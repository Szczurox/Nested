import { ChannelType } from "context/channelContext";
import { createFirebaseApp } from "../../global-utils/clientApp";
import {
	getFirestore,
	collection,
	addDoc,
	serverTimestamp,
	arrayUnion,
	setDoc,
	doc,
	getDocs,
	orderBy,
	query,
	limit,
} from "firebase/firestore";

const app = createFirebaseApp();
const db = getFirestore(app!);

export const addChannel = async (
	channelName: string,
	guild: string,
	category: string = "",
	type: ChannelType = "TEXT",
	permissions: string[] = ["SEND_MESSAGES", "VIEW_CHANNEL"]
) => {
	const channelsCollection = collection(db, "groups", guild, "channels");

	const topOrder = await getDocs(
		query(channelsCollection, orderBy("order", "desc"), limit(1))
	);

	await addDoc(channelsCollection, {
		name: channelName.replace(/\s/g, "").length
			? channelName
			: "new-channel",
		createdAt: serverTimestamp(),
		categoryId: category,
		type: type,
		order: !topOrder.empty ? topOrder.docs[0].data().order + 1 : 0,
	}).then(
		async (document) =>
			await setDoc(
				doc(
					channelsCollection,
					document.id,
					"participants",
					"everyone"
				),
				{
					permissions: arrayUnion(...permissions),
				}
			)
	);
};
