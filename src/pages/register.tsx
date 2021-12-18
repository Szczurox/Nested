import React from "react";
import Link from "next/link";
import { Formik, Field, Form } from "formik";
import styles from "../styles/Auth.module.scss";
import { motion, Variants } from "framer-motion";

export const Register: React.FC<{}> = ({}) => {
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
          initialValues={{ usernameOrEmail: "", password: "" }}
          onSubmit={async (values) => {
            console.log(
              "dupa123: " + values.password + ", " + values.usernameOrEmail
            );
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <p className={styles.data_text}>USERNAME</p>
              <Field
                className={styles.auth_field}
                name="username"
                placeholder="username"
                label="Username"
                type="username"
              />
              <p className={styles.data_text}>EMAIL</p>
              <Field
                class={styles.auth_field}
                name="Email"
                placeholder="email"
                label="Email"
              />
              <p className={styles.data_text}>PASSWORD</p>
              <Field
                className={styles.auth_field}
                name="password"
                placeholder="password"
                label="Password"
                type="password"
              />
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
