"use client";

import { Tabs, ConfigProvider } from 'antd';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';

const LoginRegisterPage = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#722ed1', // 设置全局主题色为紫色
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
        padding: '0 20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        border: '1px solid #ddd',
        width: '80%',
        margin: '0 auto',
      }}
    >
      {/* 上方图标和宣传语 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          textAlign: 'center',
          marginBottom: '80px',
        }}
      >
          <img src="/_next/static/images/logo_tmp.png" alt="Logo" style={{ width: 150, height: 150, marginBottom: 10 }} />
        <div style={{ fontSize: '36px', fontWeight: 'bold' }}>Welcome to Galaxia Chat!</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'gray' }}>Your Universe of Infinite Conversations.</div>
      </div>

      {/* 登录和注册切换 Tabs */}
      <Tabs
        defaultActiveKey="login"
        centered
        items={[
          {
            key: 'login',
            label: '登录',
            children: <LoginForm />,
          },
          {
            key: 'register',
            label: '注册',
            children: <RegisterForm />,
          },
        ]}
      />
    </div>
    </ConfigProvider>
  );
};

export default LoginRegisterPage;