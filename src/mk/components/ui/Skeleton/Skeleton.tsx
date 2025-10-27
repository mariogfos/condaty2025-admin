import styles from "./styles.module.css";
const CardSkeleton = () => {
  return (
    <div className={styles.cardSkeleton}>
      <div>
        <div />
        <div />
      </div>
      <div>
        <div />
      </div>
    </div>
  );
};
export default CardSkeleton;

// export function RevenueChartSkeleton() {
//   return (
//     <div
//       className={styles.revenueChartSkeleton}
//     >
//       <div />
//       <div >
//         <div/>
//         <div>
//           <div/>
//           <div/>
//         </div>
//       </div>
//     </div>
//   );
// }

export function RowSkeleton() {
  return (
    <div className={styles.rowSkeleton}>
      <div>
        <div />
        <div>
          <div />
          <div />
        </div>
      </div>
      <div />
    </div>
  );
}

export function TableSkeleton() {
  return (
    <>
      <div className={styles.tableSkeleton}>
        <div>
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      </div>
    </>
  );
}

export function WidgetSkeleton() {
  return (
    <div className={styles.skeletonWrapper}>
      <div className={styles.skeletonContainer}>
        {/* <div className={`${styles.skeleton} ${styles.skeletonText}`}></div>
        <div className={`${styles.skeleton} ${styles.skeletonSmall}`}></div> */}
        <div className={styles.skeletonRow}>
          <div className={`${styles.skeleton} ${styles.skeletonMap}`}></div>
          <div className={styles.skeletonColumn}>
            <div className={`${styles.skeleton} ${styles.skeletonTop}`}></div>
            <div
              className={`${styles.skeleton} ${styles.skeletonBottom}`}
            ></div>
          </div>
        </div>
        <div className={`${styles.skeleton} ${styles.skeletonTable}`}></div>
      </div>
    </div>
  );
}

export function DetailSurveySkeleton() {
  return (
    <div className={styles.skeletonWrapper}>
      <div className={styles.skeletonContainer}>
        <div className={`${styles.skeleton} ${styles.skeletonText}`}></div>
        <div className={`${styles.skeleton} ${styles.skeletonSmall}`}></div>
        <div className={styles.skeletonRow}>
          <div className={`${styles.skeleton} ${styles.skeletonMap}`}></div>
          <div className={`${styles.skeleton} ${styles.skeletonMap}`}></div>
        </div>
        <div className={styles.skeletonRow}>
          <div className={`${styles.skeleton} ${styles.skeletonMap}`}></div>
          <div className={`${styles.skeleton} ${styles.skeletonMap}`}></div>
        </div>
      </div>
      <div
        className={`${styles.skeleton} ${styles.skeletonTable}`}
        style={{ marginTop: "16px" }}
      ></div>
    </div>
  );
}

export const MaintenanceSkeleton = () => {
  return (
    <div className={styles.skeletonWrapper}>
      <div className={styles.skeletonContainer}>
        <div className={styles.skeletonRow}>
          <div className={`${styles.skeleton} ${styles.skeletonBottom}`}></div>
          <div className={`${styles.skeleton} ${styles.skeletonBottom}`}></div>
        </div>
      </div>
    </div>
  );
};
