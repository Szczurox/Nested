import React, { useEffect } from "react";
import Link from "next/link";
import { Formik, Field, Form } from "formik";
import styles from "@/styles/Auth.module.scss";
import { motion, Variants } from "framer-motion";
import { useUser } from "@/context/userContext";
import { useRouter } from "next/router";
import { wait } from "@/components/utils/utils";
import { serverRequest } from "@/global-utils/serverClient";

export const Login: React.FC<{}> = ({}) => {
	const router = useRouter();
	const { ref, id } = router.query;

	// Ensure your useUser context provides a refresh function if possible
	const { user, loadingUser, refreshUser } = useUser();

	const easing = [0.06, -0.5, 0.01, 0.99] as const;

	const fadeInUp: Variants = {
		initial: { y: -60, opacity: 0 },
		animate: {
			y: 0,
			opacity: 1,
			transition: { duration: 0.6, ease: easing },
		},
	};

	useEffect(() => {
		if (user.uid !== "" && !loadingUser) router.push("/chat");
	}, [user.uid, loadingUser, router]);

	const signIn = async (values: any, setFieldError: any) => {
		try {
			await serverRequest("/api/auth/login", {
				method: "POST",
				body: JSON.stringify({
					username: values.username,
					password: values.password,
				}),
			});

			await refreshUser();

			if (ref) {
				await wait(600).then(() => router.push(`${ref}?id=${id}`));
			} else {
				router.push("/chat");
			}
		} catch {
			setFieldError("username", "Invalid username or password");
		}
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
					initialValues={{ username: "", password: "" }}
					onSubmit={(values, { setFieldError }) =>
						signIn(values, setFieldError)
					}
				>
					{({ isSubmitting, errors }) => (
						<Form>
							<div
								className={
									errors.username
										? styles.auth_element_error
										: "auth_element"
								}
							>
								<p className={styles.data_text}>
									USERNAME{" "}
									{errors.username
										? " - " + errors.username
										: null}
								</p>
								<Field
									className={styles.auth_field}
									name="username"
									placeholder="username"
									type="text"
								/>
							</div>
							<div
								className={
									errors.password
										? styles.auth_element_error
										: "auth_element"
								}
							>
								<p className={styles.data_text}>
									PASSWORD
									{errors.password
										? " - " + errors.password
										: null}
								</p>
								<Field
									className={styles.auth_field}
									name="password"
									placeholder="password"
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
