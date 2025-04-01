"use client";
import {
  AlipayOutlined,
  LockOutlined,
  MobileOutlined,
  TaobaoOutlined,
  UserOutlined,
  WeiboOutlined,
} from '@ant-design/icons';
import {
  LoginFormPage,
  ProConfigProvider,
  ProFormCaptcha,
  ProFormCheckbox,
  ProFormText,
} from '@ant-design/pro-components';
import { Button, Divider, Space, Tabs, message, theme ,Flex} from 'antd';
import type { CSSProperties } from 'react';
import { UseDispatch } from 'react-redux';
import store, { RootState } from "../redux/store";
import { BACKEND_URL, FAILURE_PREFIX, LOGOUT_SUCCESS,LOGOUT_FAILED,SIGNOUT_SUCCESS,SIGNOUT_FAILED } from "../constants/string";
import { useState } from 'react';
//import { useRouter } from 'next/compat/router'; // 引入 useRouter
import{ useRouter } from 'next/navigation'; // 使用新的 useRouter
import { useEffect } from 'react';
import { Provider, useSelector, useDispatch } from "react-redux";
type LoginType = 'account';
const Page = () => {
  //const [userName, setUserName] = useState("");
  const userName = useSelector((state: RootState) => state.auth.name);
  const [password, setPassword] = useState("");
  const token=store.getState().auth.token
  const router = useRouter();
  const logout = async () => {
    try {
      const token=store.getState().auth.token
       // 确保 token 存在
    if (!token) {
      console.error("No JWT token found");
      return;
  }

  const response = await fetch('/api/logout', {
      method: 'POST',
      headers: {
          'Authorization': token as string,  // 传递 JWT token
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          userName: userName  // 传递用户名
      })
  });

      const data = await response.json();
      console.log(data);
      console.log(token)
      console.log(userName)
      if (data.code === 0) {
        //message.success("登录成功！");
        alert(LOGOUT_SUCCESS);
          // 清空 Redux 里的 token
        // 这里可以添加登录成功后的逻辑，比如跳转页面
        router.push(".");
      } else {
        //message.error(data.message || "登录失败，请检查用户名和密码");
        alert(FAILURE_PREFIX + (data.message || LOGOUT_FAILED));
      }
    } catch (error) {
      alert(FAILURE_PREFIX + error);
      //message.error("请求失败，请稍后重试");
    }
  };

  return (
    <Flex gap="small" wrap>
    <Button type="primary"
      onClick={async () => {
        await logout();
      }}
    >logout</Button>
    <Button>Default Button</Button>
  </Flex>
  );
};

export default () => {
  return (
    <ProConfigProvider dark>
      <Page />
    </ProConfigProvider>
  );
};