"use client";

import { Provider } from "react-redux";
import store from "./redux/store";  // 使用默认导入

export default function Providers({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}