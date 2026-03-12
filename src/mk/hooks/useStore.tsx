import { useSyncExternalStore } from "react";

export type ListenerStore = () => void;

function createStore<T>({ initialState }: { initialState: T }) {
  let state = initialState;
  let listeners: ListenerStore[] = [];

  const notifyChangeState = () => {
    listeners.forEach((listener) => listener());
  };

  const getSnapshot = () => state;
  const setState = (newState: T) => {
    if (JSON.stringify(state) === JSON.stringify(newState)) return;
    state = newState;
    notifyChangeState();
  };

  const subscribe = (listener: ListenerStore) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  };

  return { getSnapshot, setState, subscribe };
}

export function createUseStore<T>(initialState: T) {
  const store = createStore<T>({ initialState });
  return () =>
    [
      useSyncExternalStore(store.subscribe, store.getSnapshot),
      store.setState,
    ] as const;
}
