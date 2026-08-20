"use client";
import { useState, useEffect } from "react";

const useLongPress = (onLongPress: Function, ms: number = 1000) => {
  const [startLongPress, setStartLongPress] = useState(false);
  const [click, setClick] = useState(false);

  useEffect(() => {
    let timerId: any;
    console.log("startLongPress", startLongPress);

    if (startLongPress) {
      setClick(false);
      timerId = setTimeout(onLongPress, ms);
    } else {
      clearTimeout(timerId);
      setClick(true);
    }

    return () => {
      clearTimeout(timerId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startLongPress]);

  const start = () => setStartLongPress(true);
  const stop = () => setStartLongPress(false);

  return {
    props: {
      onMouseDown: start,
      onMouseUp: stop,
      onMouseLeave: stop,
      onTouchStart: start,
      onTouchEnd: stop,
    },
    click,
  };
};

export default useLongPress;
