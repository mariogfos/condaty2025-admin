import Input from "@/mk/components/forms/Input/Input";
import InputPassword from "@/mk/components/forms/InputPassword/InputPassword";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { PropsLogin } from "../LoginView";
import styles from "./signInModal.module.css";
import Button from "@/mk/components/forms/Button/Button";

interface PropsType extends PropsLogin {
  open: boolean;
  setOpen: Function;
}

export const SignInModal: any = ({
  open,
  setOpen,
  formState,
  handleChange,
  handleSubmit,
  errors,
}: PropsType) => {
  return (
    <DataModal
      open={open}
      title=""
      buttonText="Ingresar"
      onClose={() => setOpen(false)}
      buttonCancel=""
      fullScreen={true}
      onSave={handleSubmit}
      disabled={!formState.password || !formState.email}
    >
      <div className={styles.signInModal}>
        <div>
          <div>Accede a tu cuenta</div>
          <div>
            Por favor, ingresa tus datos para así mantenerte informado sobre tu
            movimiento
          </div>
          <Input
            label="Carnet de identidad"
            name="email"
            required
            value={formState.email}
            onChange={handleChange}
            error={errors}
          />
          <InputPassword
            label="Contraseña"
            required
            name="password"
            value={formState.password}
            onChange={handleChange}
            error={errors}
          />
          <div className="link"> Olvidé mi contraseña</div>
        </div>
        <div>
          Recuerda que al momento de ingresar estás aceptando nuestra política
          de privacidad y nuestras condiciones uso.
        </div>
      </div>
    </DataModal>
  );
};
