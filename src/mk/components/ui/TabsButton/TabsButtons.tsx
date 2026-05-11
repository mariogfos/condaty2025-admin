import styles from "./tabsButton.module.css";
type PropsType = {
  sel: string;
  tabs:
    | { value: string; text: string; numero?: number }[]
    | Record<string, any>;
  setSel: Function;
  val?: string;
  text?: string;
  variant?: "default" | "rounded" | "pill";
};
const TabsButtons = ({
  sel,
  tabs,
  setSel,
  val = "value",
  text = "text",
  variant = "default", // Valor por defecto
}: PropsType) => {
  const containerClass =
    variant === "pill"
      ? styles.tabsButtonPill
      : variant === "rounded"
        ? styles.tabsButtonRounded
        : styles.tabsButton;

  const buttonClass = (isSelected: boolean) => {
    if (variant === "pill") {
      return isSelected ? styles.selectedPill : styles.buttonPill;
    }
    if (variant === "rounded") {
      return isSelected ? styles.selectedRounded : styles.buttonRounded;
    }
    return isSelected ? styles.selected : "";
  };

  return (
    <div className={containerClass}>
      {tabs.map((tab: any, i: number) => (
        <button
          key={tab[val] + i}
          onClick={() => setSel(tab[val])}
          className={buttonClass(sel == tab[val])}
        >
          {tab[text]}
          {tab.numero > 0 && <span>{tab.numero}</span>}
        </button>
      ))}
    </div>
  );
};

export default TabsButtons;
