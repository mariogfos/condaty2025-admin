import Input from "@/mk/components/forms/Input/Input";
import InputPassword from "@/mk/components/forms/InputPassword/InputPassword";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { PropsLogin } from "../LoginView";
import styles from "./signInModal.module.css";
import Button from "@/mk/components/forms/Button/Button";
import { useScopedI18n } from "@/i18n/useScopedI18n";

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
  const { t } = useScopedI18n("auth");

  return (
    <DataModal
      open={open}
      title=""
      buttonText={t("loginAction")}
      onClose={() => setOpen(false)}
      buttonCancel=""
      fullScreen={true}
      onSave={handleSubmit}
      variant={"mini"}
      disabled={!formState.password || !formState.email}
      ignoreTranslation
    >
      <div className={styles.signInModal} data-i18n-ignore="true">
        <div>
          <div>{t("accessAccount")}</div>
          <div>{t("accessAccountSubtitle")}</div>
          <Input
            label={t("identityDocumentLabel")}
            name="email"
            required
            value={formState.email}
            onChange={handleChange}
            error={errors}
          />
          <InputPassword
            label={t("passwordLabel")}
            required
            name="password"
            value={formState.password}
            onChange={handleChange}
            error={errors}
          />
          <div className="link">{t("forgotPassword")}</div>
        </div>
        <div>
          {t("modalLegalDisclaimer")}
        </div>
      </div>
    </DataModal>
  );
};
