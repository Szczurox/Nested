import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Formik, Field, Form } from "formik";
import styles from "../styles/Auth.module.scss";
import { motion, Variants } from "framer-motion";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useUser } from "context/userContext";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { wait } from "components/utils/utils";

export const Login: React.FC<{}> = ({}) => {
	const router = useRouter();
	const searchParams = useSearchParams();

	const { user, loadingUser } = useUser();

	const easing = [0.06, -0.5, 0.01, 0.99];

	const fadeInUp: Variants = {
		initial: {
			y: -60,
			opacity: 0,
		},
		animate: {
			y: 0,
			opacity: 1,
			transition: {
				duration: 0.6,
				ease: easing,
			},
		},
	};

	useEffect(() => {
		// Route to chat if user is already authenticated
		console.log(user.uid);
		if (user.uid != "" && !loadingUser) router.push("/chat");
	}, [user.uid, loadingUser, router]);

	const signIn = async (values: any, setFieldError: any) => {
		const auth = getAuth();
		signInWithEmailAndPassword(auth, values.email, values.password)
			.catch((error) => {
				setFieldError("email", "Invalid email or password");
				console.log("ERROR: " + error.code + ": " + error.message);
			})
			.then((userCredential) => {
				if (userCredential) {
					if (searchParams.get("ref"))
						wait(600).then(() =>
							router.push(
								`${
									searchParams.get("ref") as string
								}?id=${searchParams.get("id")}`
							)
						);
					else router.push("/chat");
				}
			});
	};

	return (
		<motion.div
			className={styles.auth}
			exit={{ opacity: 0 }}
			initial="initial"
			animate="animate"
		>
			<motion.div className={styles.center} variants={fadeInUp}>
				<h1>Login</h1>
				<Formik
					initialValues={{ email: "", password: "" }}
					onSubmit={(values, { setFieldError }) =>
						signIn(values, setFieldError)
					}
				>
					{({ isSubmitting, errors }) => (
						<Form>
							<div
								className={
									errors.email
										? styles.auth_element_error
										: "auth_element"
								}
							>
								<p className={styles.data_text}>
									EMAIL{" "}
									{errors.email ? " - " + errors.email : null}
								</p>
								<Field
									className={styles.auth_field}
									name="email"
									placeholder="email"
									label="Email"
									type="email"
								/>
							</div>
							<div
								className={
									errors.email
										? styles.auth_element_error
										: "auth_element"
								}
							>
								<p className={styles.data_text}>
									PASSWORD
									{errors.email ? " - " + errors.email : null}
								</p>
								<Field
									className={styles.auth_field}
									name="password"
									placeholder="password"
									label="Password"
									type="password"
								/>
							</div>
							<div className={styles.forgot_password}>
								<Link href="/login">Forgot password?</Link>
							</div>
							<button
								className={styles.auth_button}
								disabled={isSubmitting}
								type="submit"
							>
								Login
							</button>
							<div className={styles.singup_link}>
								<span>
									Not a member?{" "}
									<Link href={"/register"}>Register</Link>
								</span>
							</div>
						</Form>
					)}
				</Formik>
			</motion.div>
		</motion.div>
	);
};

export default Login;
