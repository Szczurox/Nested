import React from "react";
import Link from "next/link";
import { Formik, Field, Form } from "formik";
import styles from "../styles/Auth.module.scss";
import { motion, Variants } from "framer-motion";
import { useUser } from "context/userContext";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import * as Yup from "yup";
import { useRouter } from "next/router";

const SignupSchema = Yup.object().shape({
  username: Yup.string()
    .min(2, "Must be between 2 and 32 in length")
    .max(32, "Must be between 2 and 32 in length")
    .required("This field is required"),
  email: Yup.string().required("This field is required"),
  password: Yup.string()
    .min(8, "Must be between 8 and 50 in length")
    .max(50, "Must be between 8 and 50 in length")
    .required("This field is required"),
});

export const Register: React.FC<{}> = ({}) => {
  const user = useUser();
  const router = useRouter();

  const createUser = async (username: string) => {
    const db = getFirestore();
    await setDoc(doc(db, "profile", user.uid), { username: username });
  };

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
            email: "",
            password: "",
          }}
          validationSchema={SignupSchema}
          validateOnChange={false}
          validateOnBlur={false}
          onSubmit={async (values, { setFieldError }) => {
            const auth = getAuth();
            createUserWithEmailAndPassword(auth, values.email, values.password)
              .catch((error) => {
                console.log("ERROR " + error.code + ": " + error.message);
                switch (error.code) {
                  case "auth/email-already-in-use":
                    setFieldError(
                      "email",
                      "Account with this email already exists"
                    );
                    break;
                  case "auth/invalid-email":
                    setFieldError("email", "Invalid email");
                    break;
                  case "auth/weak-password":
                    setFieldError("password", "Password is too weak");
                    break;
                  default:
                    break;
                }
              })
              .then((userCredential) => {
                if (userCredential) {
                  user.uid = userCredential.user.uid;
                  createUser(values.username);
                  router.push("/chat");
                }
              });
          }}
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
                  errors.email && touched.email
                    ? styles.auth_element_error
                    : "auth_element"
                }
              >
                <p className={styles.data_text}>
                  EMAIL{" "}
                  {errors.email && touched.email ? " - " + errors.email : null}
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
                  Already have an account?
                  <Link href="/login">
                    <a> Login</a>
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

export default Register;
