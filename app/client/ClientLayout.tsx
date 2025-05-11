"use client";
import { usePathname, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../redux/store";
import { resetAuth } from "../redux/auth";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  /*
  return (
    <div style={{ padding: 120 }}>
      {children}
      {pathname !== "/login" && (
        auth.token ? (
          <>
            <p>Logged in as user name: {auth.name}</p>
            <button onClick={() => dispatch(resetAuth())}>Logout</button>
          </>
        ) : (
          <button onClick={() => router.push("/login")}>Go to login</button>
        )
      )}
    </div>
  );
  */

  return (
    <div style={{ padding: 0 }}>
      {children}
    </div>
  );
}