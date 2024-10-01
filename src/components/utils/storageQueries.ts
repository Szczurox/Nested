import { updateDoc, doc, getFirestore } from "firebase/firestore";
import {
	uploadBytesResumable,
	getDownloadURL,
	getStorage,
	ref,
} from "firebase/storage";
import { createFirebaseApp } from "global-utils/clientApp";

async function fileSubmit(url: string, uid: string) {
	const app = createFirebaseApp();
	const db = getFirestore(app!);

	await updateDoc(doc(db, "profile", uid), {
		avatar: url,
	})
		.catch((err) => console.log("User Error: " + err))
		.then(async () => {
			var storedGroups: string[] = localStorage.getItem("groups")
				? JSON.parse(localStorage.getItem("groups")!)
				: [];
			storedGroups.forEach(async (el) => {
				await updateDoc(doc(db, "groups", el, "members", uid), {
					avatar: url,
				}).catch((err) => console.log("Member Error: " + err));
			});
		});
}

export const uploadAvatar = async (file: File, uid: string) => {
	const storage = getStorage();

	const fileRef = ref(storage, `profiles/${uid}`);
	const uploadTask = uploadBytesResumable(fileRef, file!);
	uploadTask.on(
		"state_changed",
		(snapshot) => {
			const progress =
				(snapshot.bytesTransferred / snapshot.totalBytes) * 100;
			console.log("Upload is " + progress + "% done");
			switch (snapshot.state) {
				case "paused":
					console.log("Upload is paused");
					break;
				case "running":
					console.log("Upload is running");
					break;
			}
		},
		(error) => {
			console.log(error);
		},
		() => {
			getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
				console.log("Avatar uploaded! ", downloadURL);
				fileSubmit(downloadURL, uid);
			});
		}
	);
};
