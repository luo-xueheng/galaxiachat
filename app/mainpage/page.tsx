"use client";
import { Button, Flex } from "antd";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { setName, setToken } from "../redux/auth"; // 导入 setToken 用于清空 token
import store, { RootState } from "../redux/store";
import { BACKEND_URL, FAILURE_PREFIX, LOGOUT_SUCCESS, LOGOUT_FAILED } from "../constants/string";

const Page = () => {
  const userName = useSelector((state: RootState) => state.auth.name);
  const token = useSelector((state: RootState) => state.auth.token);
  const router = useRouter();
  const dispatch = useDispatch();
    // 组件加载时从 localStorage 获取 token 并恢复 Redux 状态
    useEffect(() => {
      const storedToken = localStorage.getItem("token");
      const storedUserName = localStorage.getItem("userName");
  
      if (storedToken) {
        dispatch(setToken(storedToken));
      }
      if (storedUserName) {
        dispatch(setName(storedUserName));
      }
    }, [dispatch]);
  const logout = async () => {
    try {
      if (!token) {
        console.error("No JWT token found");
        return;
      }
      console.log(token);
      console.log(userName);
      const response = await fetch(`${BACKEND_URL}/api/logout`, {
        method: "POST",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userName }),
      });

      const data = await response.json();
      if (data.code === 0) {
        alert(LOGOUT_SUCCESS);

        // **清空 Redux 里的 token**
        dispatch(setToken(null));
        

        // **清空 localStorage**
        localStorage.removeItem("token");
        localStorage.removeItem("userName");

        // 跳转回登录页面
        router.push(".");
      } else {
        alert(FAILURE_PREFIX + (data.message || LOGOUT_FAILED));
      }
    } catch (error) {
      alert(FAILURE_PREFIX + error);
    }
  };

  return (
    <Flex gap="small" wrap>
      <Button type="primary" onClick={logout}>
        logout
      </Button>
      <Button onClick={() => router.push("/signout")}>signout</Button>
    </Flex>
  );
};

export default Page;