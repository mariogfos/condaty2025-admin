import { useEffect } from "react";
import usePrevious from "./usePrevious";

const useEffectDebug = (effectFunction:any, dependencies:any) => {
  const previousDependencies = usePrevious(dependencies, []);
  const changedDependencies = dependencies.reduce(
    (accum:any, dependency:any, index:any) => {
      if (dependency !== previousDependencies[index]) {
        const keyIdx = index;
        accum[keyIdx] = {
          before: previousDependencies[index],
          after: dependency,
        };
      }
      return accum;
    },
    {}
  );
  if (Object.keys(changedDependencies).length) {
    console.log("[use-effect - dependency-debugger]", changedDependencies);
  }
  useEffect(effectFunction, [effectFunction, ...dependencies]);
};

export default useEffectDebug;
