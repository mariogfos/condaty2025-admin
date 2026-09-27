import { useState } from "react";
import {
  IconEye,
  IconEyeOff,
} from "../../../../components/layout/icons/IconsBiblioteca";
import Input from "../Input/Input";
import { PropsTypeInputBase } from "../ControlLabel";

interface PropsType extends PropsTypeInputBase {
  repeatPassword?: boolean;
  repeatPasswordValue?: string;
  onChangeRepeat?: (e: any) => void;
  labelRepeat?: string;
  placeholderRepeat?: string;
  nameRepeat?: string;
  onBlur?: any;
  /**
   * 🔴 Por defecto `new-password`. `Input` pone `off`, y los gestores de
   * contraseñas IGNORAN `off` en un campo de contraseña: pueden rellenar la
   * clave guardada del admin en el alta de un usuario, en la contraseña nueva
   * del perfil o en la API Key y la clave del banco del QR dinámico — y al
   * guardar, esa clave viaja como si fuera la del otro. Sólo el login, que
   * pide la clave propia, pasa `current-password`.
   */
  autoComplete?: "new-password" | "current-password";
}

const InputPassword = ({
  label = "Contraseña",
  name = "password",
  placeholder = "",
  required = false,
  onChange = (e) => {},
  value,
  onBlur,
  error = null,
  repeatPassword = false,
  repeatPasswordValue = "",
  onChangeRepeat = (e) => {},
  labelRepeat = "Repetir contraseña",
  placeholderRepeat = "",
  nameRepeat = "repeatPassword",
  className = "",
  readOnly = false,
  autoComplete = "new-password",
}: PropsType) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRepeat, setShowPasswordRepeat] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const togglePasswordVisibilityRepeat = () => {
    setShowPasswordRepeat(!showPasswordRepeat);
  };

  const iconRight = showPassword ? (
    <IconEye onClick={togglePasswordVisibility} />
  ) : (
    <IconEyeOff onClick={togglePasswordVisibility} />
  );

  const iconRightRepeat = showPasswordRepeat ? (
    <IconEye onClick={togglePasswordVisibilityRepeat} />
  ) : (
    <IconEyeOff onClick={togglePasswordVisibilityRepeat} />
  );

  return (
    <div className={"inputPassword" + " " + className}>
      <Input
        value={value}
        onChange={onChange}
        type={showPassword ? "text" : "password"}
        autoComplete={autoComplete}
        name={name}
        label={label}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
        iconRight={iconRight}
        error={error}
      />
      {repeatPassword && (
        <Input
          value={repeatPasswordValue}
          onChange={onChangeRepeat}
          type={showPasswordRepeat ? "text" : "password"}
          autoComplete="new-password"
          name={nameRepeat}
          label={labelRepeat}
          placeholder={placeholderRepeat}
          required={required}
          readOnly={readOnly}
          iconRight={iconRightRepeat}
          error={error}
        />
      )}
    </div>
  );
};
export default InputPassword;
