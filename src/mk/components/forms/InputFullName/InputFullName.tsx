import Input from "@/mk/components/forms/Input/Input";
import styles from "./inputFullName.module.css";
import { PropsTypeInputBase } from "../ControlLabel";

interface PropsType extends PropsTypeInputBase {
  errors?: any;
  prefijo?: string;
}

const InputFullName = ({
  value,
  errors,
  prefijo = "",
  onChange = (e) => {},
  disabled = false,
  readOnly = false,
  className = "",
  style = {},
  onBlur = (e) => {},
}: PropsType) => {
  const _onChange = (e: any) => {
    let value = e.target.value;
    value = value.replace(/[.\s]/g, "");
    onChange({ target: { name: e.target.name, value: value } });
  };

  return (
    <div className={styles.inputFullName + ' ' + className}>
      <div className={styles.inputFullNameContainer}>
        <Input
          label="Primer nombre"
          type="text"
          name={'name' + prefijo}
          error={errors}
          required={true}
          disabled={disabled}
          readOnly={readOnly}
          value={value['name' + prefijo]}
          onChange={_onChange}
          style={style}
          onBlur={() => onBlur('name' + prefijo)}
        />
        <Input
          label="Apellido paterno"
          type="text"
          name={'last_name' + prefijo}
          error={errors}
          required={true}
          disabled={disabled}
          readOnly={readOnly}
          value={value['last_name' + prefijo]}
          onChange={_onChange}
          style={style}
          onBlur={() => onBlur('last_name' + prefijo)}
        />
      </div>
      <div className={styles.inputFullNameContainer}>
        <Input
          label="Segundo nombre"
          type="text"
          name={'middle_name' + prefijo}
          disabled={disabled}
          required={false}
          readOnly={readOnly}
          value={value['middle_name' + prefijo]}
          onChange={_onChange}
          error={errors}
          style={style}
          onBlur={() => onBlur('middle_name' + prefijo)}
        />
        <Input
          label="Apellido materno"
          type="text"
          name={'mother_last_name' + prefijo}
          disabled={disabled}
          required={false}
          readOnly={readOnly}
          value={value['mother_last_name' + prefijo]}
          onChange={_onChange}
          style={style}
          error={errors}
          onBlur={() => onBlur('mother_last_name' + prefijo)}
        />
      </div>
    </div>
  );
};

export default InputFullName;
