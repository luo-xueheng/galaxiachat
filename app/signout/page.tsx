'use client';

import {
  LockOutlined,
  MobileOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  LoginForm,
  ProFormText,
} from '@ant-design/pro-components';
import { Tabs, message, ConfigProvider } from 'antd';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { BACKEND_URL, FAILURE_PREFIX, SIGNOUT_SUCCESS, SIGNOUT_FAILED } from "../constants/string";
import { RootState } from "../redux/store";
import { setName, setToken } from "../redux/auth";

type SignoutType = 'password' | 'email' | 'phone';

const SignoutPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [signoutType, setSignoutType] = useState<SignoutType>('password');
  const userName = useSelector((state: RootState) => state.auth.name);
  const token = useSelector((state: RootState) => state.auth.token);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserName = localStorage.getItem("userName");
    if (storedUserName) {
      dispatch(setName(storedUserName));
    }
    if (storedToken) {
      dispatch(setToken(storedToken));
    }
  }, [dispatch]);

  const handleSignout = async (data: Record<string, string>) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/signout`, {
        method: "POST",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const res = await response.json();

      if (res.code === 0) {
        alert(SIGNOUT_SUCCESS + userName);
        dispatch(setToken(null));
        dispatch(setName(null));
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        router.push("/");
      } else {
        alert(SIGNOUT_FAILED);
      }
    } catch (err) {
      alert(FAILURE_PREFIX + err);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#722ed1', // 设置主题色为紫色
        },
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          padding: '100px 20px', // 增加顶部和底部的内边距
          backgroundColor: '#f5f5f5',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid #ddd',
          width: '80%',
          margin: '0 auto',
        }}
      >
        {/* 上方图标和欢迎语 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            textAlign: 'center',
            marginBottom: '40px',
          }}
        >
          <img src="/_next/static/images/logo_tmp.png" alt="Logo" style={{ width: 150, height: 150, marginBottom: 10 }} />
          <div style={{ fontSize: '36px', fontWeight: 'bold' }}>Goodbye from Galaxia Chat!</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'gray' }}>
            We're sad to see you go.
          </div>
        </div>

        {/* 注销表单 */}
        <LoginForm
          title="Sign Out"
          subTitle="Choose a method to sign out"
          submitter={{
            searchConfig: {
              submitText: '注销',
            },
          }}
          onFinish={async (values) => {
            if (signoutType === 'password') {
              await handleSignout({ userName, password: values.password });
            } else if (signoutType === 'email') {
              await handleSignout({ userName, email: values.email });
            } else if (signoutType === 'phone') {
              await handleSignout({ userName, phone: values.phone });
            }
            return true;
          }}
        >
          <Tabs
            centered
            activeKey={signoutType}
            onChange={(activeKey) => setSignoutType(activeKey as SignoutType)}
          >
            <Tabs.TabPane key="password" tab="通过密码注销" />
            <Tabs.TabPane key="email" tab="通过邮箱注销" />
            <Tabs.TabPane key="phone" tab="通过手机注销" />
          </Tabs>

          {signoutType === 'password' && (
            <ProFormText.Password
              name="password"
              fieldProps={{
                size: 'large',
                prefix: <LockOutlined style={{ color: '#722ed1' }} />,
                value: password,
                onChange: (e) => setPassword(e.target.value),
              }}
              placeholder="请输入密码"
              rules={[{ required: true, message: '请输入密码!' }]}
            />
          )}
          {signoutType === 'email' && (
            <ProFormText
              name="email"
              fieldProps={{
                size: 'large',
                prefix: <UserOutlined style={{ color: '#722ed1' }} />,
                value: email,
                onChange: (e) => setEmail(e.target.value),
              }}
              placeholder="请输入邮箱"
              rules={[{ required: true, message: '请输入邮箱!' }]}
            />
          )}
          {signoutType === 'phone' && (
            <ProFormText
              name="phone"
              fieldProps={{
                size: 'large',
                prefix: <MobileOutlined style={{ color: '#722ed1' }} />,
                value: phone,
                onChange: (e) => setPhone(e.target.value),
              }}
              placeholder="请输入手机号"
              rules={[{ required: true, message: '请输入手机号!' }]}
            />
          )}
        </LoginForm>
      </div>
    </ConfigProvider>
  );
};

export default SignoutPage;