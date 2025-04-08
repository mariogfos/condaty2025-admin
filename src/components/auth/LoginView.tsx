
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
      <div className={styles.wrapper}>
        <div className={styles.imageContainer}>
          <Image
            src="/assets/images/Resident2.png"
            alt="adminDesktop"
            width={1024}
            height={768}
            className={styles.desktopImage}
            priority
          />
          <Image
            src="/assets/images/adminTablet.png"
            alt="admTablet"
            width={768}
            height={476}
            className={styles.tabletImage}
            priority
          />
          <Image
            src="/assets/images/adminLogin.png"
            alt="admMobile"
            width={375}
            height={476}
            className={styles.mobileImage}
            priority
          />
        </div>      
        <div className={styles.formContainer}>
          <div className={styles.formWrapper}>
            <div className={styles.logo}>
              <Image
              src="/assets/images/Condaty-completo-1.svg"
              alt="adminDesktop"
              width={164}
              height={49}
              className={styles.desktopLogoImage}
              priority/>
              
            </div>
            
            <div className={styles.titleSection}>
              <div className={styles.mobileTitle}>
                Administrador
              </div>
              <div className={styles.desktopTitle}>
                Bienvenido administrador
              </div>
              
            </div>
            
            <form className={styles.form} onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}>
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
              <Button
                className={styles.button}
                
              >
                Iniciar sesión
              </Button>
              {/* Añade esto después del "Olvidé mi contraseña" */}
            <div className={styles.termsContainer}>
              Al iniciar sesión aceptas los <a href="#">Términos y Condiciones</a> y nuestras <a href="#">Políticas de Privacidad</a>
            </div>
            </form>
            
            
          </div>
        </div>
      </div>
      <ForgotPass open={openModal} setOpen={setOpenModal} mod="adm" />
    </div>
  );
};

export default LoginView;