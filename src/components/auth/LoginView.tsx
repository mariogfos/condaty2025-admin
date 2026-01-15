"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Input from "@/mk/components/forms/Input/Input";
import InputPassword from "@/mk/components/forms/InputPassword/InputPassword";
import InputCode from "@/mk/components/forms/InputCode/InputCode";
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
  showVerification?: boolean;
  verificationCode?: string;
  setVerificationCode?: (code: string) => void;
  onVerify?: () => void;
  onBack?: () => void;
}

const LoginView = ({
  errors,
  formState,
  handleChange,
  handleSubmit,
  config,
  showVerification = false,
  verificationCode = "",
  setVerificationCode = () => {},
  onVerify = () => {},
  onBack = () => {},
}: PropsLogin) => {
  const [openModal, setOpenModal] = useState(false);
  const [timer, setTimer] = useState(59);
  const [canResend, setCanResend] = useState(false);
  // Mock states for demonstration as requested
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [mockErrors, setMockErrors] = useState<any>({});

  useEffect(() => {
    if (showVerification) {
      setTimer(59);
      setCanResend(false);
      // Reset mocks when showing verification
      setAttempts(0);
      setIsBlocked(false);
      setMockErrors({});
    }
  }, [showVerification]);

  // Mock function to simulate verification failure
  const handleVerifyMock = () => {
    if (attempts < 2) {
      setAttempts((prev) => prev + 1);
      // Simulate error in inputs
      setMockErrors({ code: "Código incorrecto" });
    } else {
      setAttempts((prev) => prev + 1);
      setIsBlocked(true);
      setMockErrors({ code: "Código incorrecto" });
    }
    // If we wanted to call real verify: onVerify();
  };

  useEffect(() => {
    let interval: any;
    if (showVerification && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [showVerification, timer]);

  const handleResend = () => {
    setTimer(59);
    setCanResend(false);
  };

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
            <div className={styles.title}>
              {showVerification
                ? "Ingresa el código de verificación"
                : "¡Te damos la bienvenida!"}
            </div>
          </div>

          {showVerification ? (
            <div className={styles.verificationContainer}>
              <p className={styles.verificationText}>
                Parece que estás ingresando desde un dispositivo nuevo. Para tu
                seguridad, te enviamos un código a <b>al****do@gmail.com</b>{" "}
                para confirmar tu identidad.
              </p>

              <div className={styles.codeWrapper}>
                <InputCode
                  name="code"
                  label=""
                  setCode={setVerificationCode}
                  value={verificationCode}
                  error={{ ...errors, ...mockErrors }}
                  className={styles.inputCodeCustom}
                />
              </div>

              {(errors["code"] || mockErrors["code"]) && !isBlocked && (
                <p className={styles.errorText}>
                  Pin incorrecto, tienes {3 - attempts} intentos restantes.
                </p>
              )}

              {isBlocked ? (
                <p className={styles.errorText}>
                  Has excedido el número de intentos. Bloqueado por 30 minutos.
                </p>
              ) : (
                <>
                  {canResend ? (
                    <div
                      className={styles.resendTextGreen}
                      onClick={handleResend}
                    >
                      Reenviar un nuevo código
                    </div>
                  ) : (
                    <p className={styles.resendText}>
                      Volver a solicitar código en 0:
                      {timer < 10 ? `0${timer}` : timer}
                    </p>
                  )}
                </>
              )}

              <div className={styles.verificationButtons}>
                <Button
                  className={styles.buttonSecondary}
                  onClick={onBack}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    color: "white",
                  }}
                >
                  Volver
                </Button>
                {!isBlocked && (
                  <Button className={styles.button} onClick={handleVerifyMock}>
                    Verificar
                  </Button>
                )}
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </div>
      {/* Modal (sin cambios) */}
      <ForgotPass open={openModal} setOpen={setOpenModal} mod="adm" />
    </div>
  );
};

export default LoginView;
