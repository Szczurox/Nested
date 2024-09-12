import { applyActionCode, Auth } from "firebase/auth";

export const handleVerifyEmail = (auth: Auth, actionCode: string): string => {
	applyActionCode(auth, actionCode)
		.then((resp) => {
			return resp;
		})
		.catch((error) => {
			return error;
		});
	return "";
};
