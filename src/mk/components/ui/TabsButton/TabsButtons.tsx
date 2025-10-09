import styles from "./tabsButton.module.css";
type PropsType = {
  sel: string;
  tabs:
    | { value: string; text: string; numero?: number }[]
    | Record<string, any>;
  setSel: Function;
  val?: string;
  text?: string;
};
const TabsButtons = ({
  sel,
  tabs,
  setSel,
  val = "value",
  text = "text",
}: PropsType) => {
  return (
    <div className={styles.tabsButton}>
      {tabs.map((tab: any, i: number) => (
        <button
          key={tab[val] + i}
          onClick={() => setSel(tab[val])}
          className={sel == tab[val] ? styles["selected"] : ""}
        >
          {tab[text]}
          {tab.numero > 0 && <span>{tab.numero}</span>}
        </button>
      ))}
    </div>
  );
};

export default TabsButtons;
