import { createContext, useContext } from "react";
import type { AppState } from "../types";
import type { Action } from "./appReducer";
import { initialState } from "./appReducer";

export const AppContext = createContext<AppState>(initialState);
export const DispatchContext = createContext<React.Dispatch<Action>>(() => {});

export function useApp() {
  return useContext(AppContext);
}

export function useDispatch() {
  return useContext(DispatchContext);
}
