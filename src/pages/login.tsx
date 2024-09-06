import React, { useEffect } from "react";
import Link from "next/link";
import { Formik, Field, Form } from "formik";
import styles from "../styles/Auth.module.scss";
import { motion, Variants } from "framer-motion";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useUser } from "context/userContext";
import { useRouter } from "next/router";

export const Login: React.FC<{}> = ({}) => {
	const { user, loadingUser } = useUser();
	const router = useRouter();

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
		if (user.uid != "" && !loadingUser) router.push("/chat");
	}, [user.uid, loadingUser]);

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
					onSubmit={async (values, { setFieldError }) => {
						const auth = getAuth();
						signInWithEmailAndPassword(
							auth,
							values.email,
							values.password
						)
							.catch((error) => {
								setFieldError(
									"email",
									"Invalid email or password"
								);
								console.log(
									"ERROR: " +
										error.code +
										": " +
										error.message
								);
							})
							.then((userCredential) => {
								if (userCredential) {
									console.log(user.uid);
									router.push("/chat");
								}
							});
					}}
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
									class={styles.auth_field}
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
								<Link href="/login">
									<a>Forgot password?</a>
								</Link>
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
									<Link href="/register">
										<a>Register</a>
									</Link>
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
