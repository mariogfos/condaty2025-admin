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
import { useScopedI18n } from "@/i18n/useScopedI18n";

export interface PropsLogin {
  errors: any;
  formState: any;
  handleChange: (e: any) => void;
  handleSubmit: () => void;
  config?: any;
  showVerification?: boolean;
  verificationCode?: string;
  setVerificationCode?: (code: string) => void;
  verificationMessage?: string;
  onVerify?: () => void;
  onBack?: () => void;
  showTrustDevice?: boolean;
  onTrustDevice?: (trust: boolean) => void;
  attempts?: number;
  isBlocked?: boolean;
  onResendCode?: () => void;
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
  verificationMessage = "",
  onVerify = () => {},
  onBack = () => {},
  showTrustDevice = false,
  onTrustDevice = () => {},
  attempts = 0,
  isBlocked = false,
  onResendCode = () => {},
}: PropsLogin) => {
  const [openModal, setOpenModal] = useState(false);
  const [timer, setTimer] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const { t } = useScopedI18n("auth");
  // Removed internal mock states (attempts, isBlocked, mockErrors) as they are now managed by parent

  useEffect(() => {
    if (showVerification) {
      setTimer(59);
      setCanResend(false);
    }
  }, [showVerification]);

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
    if (onResendCode) onResendCode();
  };

  const formatMessage = (msg: string) => {
    if (!msg)
      return t("verificationMessage");
    return msg.replace(
      /-+(.*?)-+/g,
      '<span style="font-weight: 800; color: #fff;">$1</span>',
    );
  };

  return (
    <div className={styles.container} data-i18n-ignore="true">
      {/* Imagen de fondo */}
      <div className={styles.imageBackground}>
        <Image
          src="/assets/images/LoginPortada.png"
          alt="Fondo de Login"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
      </div>
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
      {/* Formulario Centrado */}
      <div className={styles.formCenter}>
        <div className={styles.formWrapper}>
          <div className={styles.titleSection}>
            <div className={styles.title}>
              {showTrustDevice
                ? t("trustDeviceTitle")
                : showVerification
                  ? t("verificationTitle")
                  : t("loginTitle")}
            </div>
          </div>

          {showTrustDevice ? (
            <div className={styles.verificationContainer}>
              <p className={styles.verificationText}>
                {t("trustDeviceBody")}
              </p>

              <div className={styles.verificationButtons}>
                <Button
                  className={styles.buttonSecondary}
                  onClick={() => onTrustDevice && onTrustDevice(false)}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    color: "white",
                  }}
                >
                  {t("trustNo")}
                </Button>
                <Button
                  className={styles.button}
                  onClick={() => onTrustDevice && onTrustDevice(true)}
                >
                  {t("trustYes")}
                </Button>
              </div>
            </div>
          ) : showVerification ? (
            <div className={styles.verificationContainer}>
              <p
                className={styles.verificationText}
                dangerouslySetInnerHTML={{
                  __html: formatMessage(verificationMessage),
                }}
              />

              <div className={styles.codeWrapper}>
                <InputCode
                  name="code"
                  label=""
                  setCode={setVerificationCode}
                  value={verificationCode}
                  error={errors}
                  className={styles.inputCodeCustom}
                />
              </div>

              {errors["code"] && !isBlocked && (
                <p className={styles.errorText}>
                  {t("verificationInvalid", {
                    remaining: Math.max(3 - attempts, 0),
                  })}
                </p>
              )}

              {isBlocked ? (
                <p className={styles.errorText}>{t("verificationBlocked")}</p>
              ) : (
                <>
                  {canResend ? (
                    <div
                      className={styles.resendTextGreen}
                      onClick={handleResend}
                    >
                      {t("resendCode")}
                    </div>
                  ) : (
                    <p className={styles.resendText}>
                      {t("resendCountdown", {
                        seconds: timer < 10 ? `0${timer}` : timer,
                      })}
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
                  {t("back")}
                </Button>
                {!isBlocked && (
                  <Button className={styles.button} onClick={onVerify}>
                    {t("verify")}
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
                  label={t("identityDocumentLabel")}
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
                  label={t("passwordLabel")}
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
                {t("forgotPassword")}
              </div>
              <Button className={styles.button}>{t("loginAction")}</Button>
              <div className={styles.termsContainer}>
                {t("termsPrefix")}
                <a href="https://www.condaty.com/terminos">
                  {t("termsLink")}
                </a>{" "}
                {t("privacyConnector")}
                <a href="https://www.condaty.com/politicas">
                  {t("privacyLink")}
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
