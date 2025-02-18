"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import background from "@/../public/images/img_login.png";
import ForgotPass from "./ForgotPass";
import Input from "@/mk/components/forms/Input/Input";
import InputPassword from "@/mk/components/forms/InputPassword/InputPassword";
import Button from "@/mk/components/forms/Button/Button";
import styles from "./loginView.module.css";

export interface PropsLogin {
  errors: any;
  formState: any;
  handleChange: (e: any) => void;
  handleSubmit: () => void;
}

const LoginView = ({
  errors,
  formState,
  handleChange,
  handleSubmit,
}: PropsLogin) => {
  const [openModal, setOpenModal] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <form>
        <div className={styles.loginView}>
          <section>
            <div>
              <div>
                <div className={styles["bgAdmin"]}></div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Image
                    src={background}
                    alt=""
                    priority
                    style={{ width: 501, height: 429 }}
                  />
                </div>
              </div>
              <div>
                <div
                  className="tTitle"
                  style={{ fontSize: 48, marginBottom: "var(--spL)" }}
                >
                  La plataforma para <br />
                  gestión política
                </div>

                <div>
                  <Input
                    label="Cédula de identidad"
                    name="email"
                    required
                    value={formState.email}
                    onChange={handleChange}
                    error={errors}
                    maxLength={11}
                  />
                  <InputPassword
                    label="Contraseña"
                    required
                    name="password"
                    value={formState.password}
                    onChange={handleChange}
                    error={errors}
                    maxLength={10}
                  />
                  <Button onClick={() => handleSubmit()}>Ingresar</Button>
                </div>

                <br />
                <div className="link" onClick={() => setOpenModal(true)}>
                  {" "}
                  Olvidé mi contraseña
                </div>

                <br />
              </div>
            </div>
            {/* <div className={styles['elektaDescript']}>ELEKTA Plataforma digital de gestión política</div>  */}
          </section>
        </div>
        <ForgotPass mod={"adm"} open={openModal} setOpen={setOpenModal} />
      </form>
    </div>
  );
};

export default LoginView;
