import "../styles/globals.css";
import type { AppProps } from "next/app";
import store, { RootState } from "../redux/store";
import { resetAuth } from "../redux/auth";
//import { useRouter } from "next/router";
import { Provider, useSelector, useDispatch } from "react-redux";
import Layout from "../layout"; // 引用更新后的 Layout 组件

/*
const Layout = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const dispatch = useDispatch();
    const auth = useSelector((state: RootState) => state.auth);

    return (
        <div style={{ padding: 12 }}>
            {children}
            {router.pathname !== "/login" && (auth.token ? (
                <>
                    <p>Logged in as user name: {auth.name}</p>
                    <button onClick={() => dispatch(resetAuth())}>Logout</button>
                </>
            ) : (
                <button onClick={() => router.push("/login")}>Go to login</button>
            ))}
        </div>
    );
};
*/
/*
function App({ Component, pageProps }: AppProps) {
    return (
        <Provider store={store}>
            <Head>
                <title> Conway's Life Game</title>
            </Head>
            <Layout>
                <Component {...pageProps} />
            </Layout>
        </Provider>
    );
}

export default App;
*/

function App({ Component, pageProps }: AppProps) {
    return (
        <Provider store={store}>
            <Layout>
                <Component {...pageProps} />
            </Layout>
        </Provider>
    );
}

export default App;