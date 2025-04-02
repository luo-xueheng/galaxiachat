import "../styles/globals.css";
import type { AppProps } from "next/app";
import store, { persistor } from "../redux/store"; // 确保 Redux Store 正确导入
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import Layout from "../layout"; // 确保 Layout 存在
import Head from "next/head"; // 如果你需要 Head

function App({ Component, pageProps }: AppProps) {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <Head>
                    <title>Galaxia Chat</title>
                </Head>
                <Layout>
                    <Component {...pageProps} />
                </Layout>
            </PersistGate>
        </Provider>
    );
}

export default App;