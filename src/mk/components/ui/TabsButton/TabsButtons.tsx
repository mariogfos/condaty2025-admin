import styles from "./tabsButton.module.css";
type PropsType = {
  sel: string;
  tabs: { value: string; text: string; numero?: Number }[];
  setSel: Function;
};
const TabsButtons = ({ sel, tabs, setSel }: PropsType) => {
  return (
    <div className={styles.tabsButton}>
      {tabs.map((tab: any) => (
        <button
          key={tab.value}
          onClick={() => setSel(tab.value)}
          className={sel == tab.value ? styles["selected"] : ""}
        >
          {tab.text}
          {tab.numero > 0 && <span>{tab.numero}</span>}
        </button>
      ))}
    </div>
  );
};

export default TabsButtons;
