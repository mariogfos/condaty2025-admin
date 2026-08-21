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
        name={name}
        label={label}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
        iconRight={iconRight}
        error={error}
        maxLength={10}
      />
      {repeatPassword && (
        <Input
          value={repeatPasswordValue}
          onChange={onChangeRepeat}
          type={showPasswordRepeat ? "text" : "password"}
          name={nameRepeat}
          label={labelRepeat}
          placeholder={placeholderRepeat}
          required={required}
          readOnly={readOnly}
          iconRight={iconRightRepeat}
          error={error}
          maxLength={10}
        />
      )}
    </div>
  );
};
export default InputPassword;
