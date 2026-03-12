import { useCallback, useEffect, type Dispatch } from "react";

interface AppEvent<PayloadType = unknown> extends Event {
  detail: PayloadType;
}

export interface CustomWindowEventMap extends WindowEventMap {
  /* Custom Event */
  onNotif: AppEvent<string>;
  onReset: AppEvent<string>;
  onChatNewMsg: AppEvent<string>;
  onChatSendMsg: AppEvent<string>;
  onChatNewRoom: AppEvent<string>;
  onChatCloseRoom: AppEvent<string>;
  onOpenChat: AppEvent<string>;
}

export const useEvent = <PayloadType = unknown,>(
  eventName: keyof CustomWindowEventMap,
  callback?: Dispatch<PayloadType> | VoidFunction
) => {
  useEffect(() => {
    if (!callback) {
      return;
    }

    const listener = ((event: AppEvent<PayloadType>) => {
      callback(event.detail); // Use `event.detail` for custom payloads
    }) as EventListener;
    window.addEventListener(eventName, listener);
    return () => {
      window.removeEventListener(eventName, listener);
    };
  }, [callback, eventName]);

  const dispatch = useCallback(
    (detail: PayloadType) => {
      const event = new CustomEvent(eventName, { detail });
      window.dispatchEvent(event);
    },
    [eventName]
  );
  return { dispatch };
};

// sample use:
// const { dispatch } = useEvent('onCountUpdate');

// const handleClick = useCallback(() => {
//   setCount((prev) => {
//     dispatch(prev + 1); // notify all that smth changed
//     return prev + 1;
//   });
// }, []);

// client
// const [count, setCount] = useState(0);
//   useEvent('onCountUpdate', setCount);
