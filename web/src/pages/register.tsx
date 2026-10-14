import React, { useEffect } from "react";
import Link from "next/link";
import { Formik, Field, Form } from "formik";
import styles from "@/styles/Auth.module.scss";
import { motion, Variants } from "framer-motion";
import * as Yup from "yup";
import { useRouter } from "next/router";
import { useUser } from "@/context/userContext";
import { serverRequest } from "@/global-utils/serverClient";

const SignupSchema = Yup.object().shape({
	username: Yup.string()
		.min(2, "Must be between 2 and 32 in length")
		.max(32, "Must be between 2 and 32 in length")
		.required("This field is required"),
	password: Yup.string()
		.min(8, "Must be between 8 and 50 in length")
		.max(50, "Must be between 8 and 50 in length")
		.required("This field is required"),
});

export const Register: React.FC<{}> = ({}) => {
	const router = useRouter();

	const { user, loadingUser, refreshUser } = useUser();

	useEffect(() => {
		// Route to chat if user is already authenticated
		if (user.uid != "" && !loadingUser) router.push("/chat");
	}, [user.uid, loadingUser, router]);

	const userSubmit = async (values: any, setFieldError: any) => {
		try {
			await serverRequest("/api/auth/register", {
				method: "POST",
				body: JSON.stringify({
					username: values.username,
					password: values.password,
				}),
			});
			await refreshUser();
			router.push("/chat");
		} catch (error) {
			setFieldError(
				"username",
				(error as Error).message === "That username is already in use"
					? "Account with this username already exists"
					: "Unable to create account",
			);
		}
	};

	const easing = [0.06, -0.5, 0.01, 0.99] as const;

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

	return (
		<motion.div
			className={styles.auth}
			exit={{ opacity: 0 }}
			initial="initial"
			animate="animate"
		>
			<motion.div className={styles.center} variants={fadeInUp}>
				<h1>Register</h1>
				<Formik
					initialValues={{
						username: "",
						password: "",
					}}
					validationSchema={SignupSchema}
					validateOnChange={false}
					validateOnBlur={false}
					onSubmit={(values, { setFieldError }) =>
						userSubmit(values, setFieldError)
					}
				>
					{({ isSubmitting, errors, touched }) => (
						<Form>
							<div
								className={
									errors.username && touched.username
										? styles.auth_element_error
										: "auth_element"
								}
							>
								<p className={styles.data_text}>
									USERNAME
									{errors.username && touched.username
										? " - " + errors.username
										: null}
								</p>
								<Field
									className={styles.auth_field}
									name="username"
									placeholder="username"
									label="Username"
									type="username"
								/>
							</div>
							<div
								className={
									errors.password && touched.password
										? styles.auth_element_error
										: "auth_element"
								}
							>
								<p className={styles.data_text}>
									PASSWORD{" "}
									{errors.password && touched.password
										? " - " + errors.password
										: null}
								</p>
								<Field
									className={styles.auth_field}
									name="password"
									placeholder="password"
									label="Password"
									type="password"
								/>
							</div>
							<button
								className={styles.auth_button}
								disabled={isSubmitting}
								type="submit"
							>
								Register
							</button>
							<div className={styles.singup_link}>
								<span>
									Already have an account?{" "}
									<Link href={"/login"}>Login</Link>
								</span>
							</div>
						</Form>
					)}
				</Formik>
			</motion.div>
		</motion.div>
	);
};

export default Register;
