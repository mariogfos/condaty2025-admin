import { useContext, useEffect, useState } from "react";
import { AxiosContext } from "@/mk/contexts/AxiosInstanceProvider";
import SkeletonAdapterComponent, { SkeletonType } from "./SkeletonAdapter";
import styles from "./styles.module.css";

interface PropsType {
  type?: SkeletonType;
  className?: string;
  children?: any;
  loaded?: any; // Indicates if the data is loaded
  onlyLoading?: boolean; // If true, shows only loading animation
  circle?: boolean;
}

const LoadingScreen = ({
  type = "TableSkeleton",
  className,
  children = null,
  loaded = false,
  onlyLoading = false, // Default is false
  circle = false,
}: PropsType) => {
  const { waiting }: any = useContext(AxiosContext);
  // const [_loaded, setLoaded] = useState(loaded);

  // useEffect(() => {
  //   if (waiting === 0) {
  //     setLoaded(true);
  //   }
  // }, [waiting]);
  // console.log(_loaded);
  // // If onlyLoading is true, show the loading animation while data is not loaded
  // if (onlyLoading && !_loaded && circle) {
  //   return (
  //     <div className={styles.loadingScreen + " " + className}>
  //       <div>
  //         <div></div>
  //       </div>
  //     </div>
  //   );
  // }
  if (onlyLoading && !loaded) {
    return <SkeletonAdapterComponent type={type} />;
  }
  // If data is loaded or there are no pending requests, render the children
  if (loaded || waiting <= 0) {
    return children;
  }

  // If type is provided, render the skeleton adapter
  if (type) {
    return <SkeletonAdapterComponent type={type} />;
  }

  // Default loading animation
  return (
    <div className={styles.loadingScreen + " " + className}>
      <div>
        <div></div>
      </div>
    </div>
  );
};

export default LoadingScreen;
