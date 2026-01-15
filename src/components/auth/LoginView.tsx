"use client";

import { useState } from "react";
import Image from "next/image";
import Input from "@/mk/components/forms/Input/Input";
import InputPassword from "@/mk/components/forms/InputPassword/InputPassword";
import Button from "@/mk/components/forms/Button/Button";
import ForgotPass from "./ForgotPass";
import Logo from "@/components/req/Logo";
import styles from "./loginView.module.css";

export interface PropsLogin {
  errors: any;
  formState: any;
  handleChange: (e: any) => void;
  handleSubmit: () => void;
  config?: any;
}

const LoginView = ({
  errors,
  formState,
  handleChange,
  handleSubmit,
  config,
}: PropsLogin) => {
  const [openModal, setOpenModal] = useState(false);
  return (
    <div className={styles.container}>
      {/* Imagen de fondo */}
      <div className={styles.imageBackground}>
        <Image
          src="/assets/images/LoginPortada.png" // Asegúrate que esta es la ruta correcta
          alt="Fondo de Login"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
      </div>

      {/* Formulario Centrado */}
      <div className={styles.formCenter}>
        <div className={styles.formWrapper}>
          <div className={styles.logoContainerFloating}>
            <Image
              src="/assets/images/logologin.png"
              alt="Logo Login"
              width={360}
              height={117}
              className={styles.logoImageFloating}
              priority
            />
          </div>
          <div className={styles.titleSection}>
            <div className={styles.title}>¡Te damos la bienvenida!</div>
          </div>

          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <div className={styles.inputContainer}>
              <Input
                required
                label={config?.app?.loginLabel || "Carnet de identidad"}
                type="number"
                name="email"
                error={errors}
                value={formState.email}
                onChange={handleChange}
                maxLength={11}
              />
            </div>

            <div className={styles.inputContainer}>
              <InputPassword
                label="Contraseña"
                required
                name="password"
                error={errors}
                value={formState.password}
                onChange={handleChange}
                maxLength={10}
              />
            </div>
            <div
              className={styles.forgotPassword}
              onClick={() => setOpenModal(true)}
            >
              Olvidé mi contraseña
            </div>
            <Button className={styles.button}>Iniciar sesión</Button>
            <div className={styles.termsContainer}>
              Al iniciar sesión aceptas los{" "}
              <a href="https://www.condaty.com/terminos">
                Términos y Condiciones
              </a>{" "}
              y nuestras{" "}
              <a href="https://www.condaty.com/politicas">
                Políticas de Privacidad
              </a>
            </div>
          </form>
        </div>
      </div>
      {/* Modal (sin cambios) */}
      <ForgotPass open={openModal} setOpen={setOpenModal} mod="adm" />
    </div>
  );
};

export default LoginView;
