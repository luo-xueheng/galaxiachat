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
import { Button, Divider, Space, Tabs, message, theme } from 'antd';
import type { CSSProperties } from 'react';
import { BACKEND_URL, FAILURE_PREFIX, LOGIN_FAILED, LOGIN_SUCCESS_PREFIX } from "../constants/string";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
type registerType = 'account';

const iconStyles: CSSProperties = {
  color: 'rgba(0, 0, 0, 0.2)',
  fontSize: '18px',
  verticalAlign: 'middle',
  cursor: 'pointer',
};

const Page = () => {
  const [registerType, setLoginType] = useState<registerType>('account');
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const { token } = theme.useToken();
  const router = useRouter(); // 获取 router 实例
  const register = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName,
          password,
          email,
          phone,
        }),
      });

      const data = await response.json();
      console.log(data);
      if (data.code === 0) {
        message.success("注册成功！");
        // 这里可以添加登录成功后的逻辑，比如跳转页面
      } else {
        message.error(data.message || "注册失败，请检查用户名和密码");
      }
    } catch (error) {
      message.error("请求失败，请稍后重试");
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'white',
        height: '100vh',
      }}
    >
      <LoginFormPage
        backgroundImageUrl="https://mdn.alipayobjects.com/huamei_gcee1x/afts/img/A*y0ZTS6WLwvgAAAAAAAAAAAAADml6AQ/fmt.webp"
        logo="https://github.githubassets.com/favicons/favicon.png"
        backgroundVideoUrl="https://gw.alipayobjects.com/v/huamei_gcee1x/afts/video/jXRBRK_VAwoAAAAAAAAAAAAAK4eUAQBr"
        title="Instant Message"
        containerStyle={{
          backgroundColor: 'rgba(0, 0, 0,0.65)',
          backdropFilter: 'blur(4px)',
        }}
        subTitle="好用的即时通讯系统"
        
        onFinish={async () => {
          await register(); // 表单提交时触发登录请求
        }}
      >
        <Tabs
          centered
          activeKey={registerType}
          onChange={(activeKey) => setLoginType(activeKey as registerType)}
        >
          <Tabs.TabPane key={'account'} tab={'账号密码注册'} />
        </Tabs>
        {registerType === 'account' && (
          <>
            <ProFormText
              name="username"
              fieldProps={{
                size: 'large',
                prefix: (
                  <UserOutlined
                    style={{
                      color: token.colorText,
                    }}
                    className={'prefixIcon'}
                  />
                ),
                value: userName,
                onChange: (e) => setUserName(e.target.value),
              }}
              placeholder={'用户名: admin or user'}
              rules={[
                {
                  required: true,
                  message: '请输入用户名!',
                },
              ]}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{
                size: 'large',
                prefix: (
                  <LockOutlined
                    style={{
                      color: token.colorText,
                    }}
                    className={'prefixIcon'}
                  />
                ),
                value: password,
                onChange: (e) => setPassword(e.target.value),
              }}
              placeholder={'密码: ant.design'}
              rules={[
                {
                  required: true,
                  message: '请输入密码！',
                },
              ]}
            />
             <ProFormText
              name="email"
              fieldProps={{
                size: 'large',
                prefix: (
                  <UserOutlined
                    style={{
                      color: token.colorText,
                    }}
                    className={'prefixIcon'}
                  />
                ),
                value: email,
                onChange: (e) => setEmail(e.target.value),
              }}
              placeholder={'邮箱: email'}
              rules={[
                {
                  required: true,
                  message: '请输入邮箱!',
                },
              ]}
            />
             <ProFormText
              name="phone"
              fieldProps={{
                size: 'large',
                prefix: (
                  <UserOutlined
                    style={{
                      color: token.colorText,
                    }}
                    className={'prefixIcon'}
                  />
                ),
                value: phone,
                onChange: (e) => setPhone(e.target.value),
              }}
              placeholder={'电话号码: phone'}
              rules={[
                {
                  required: true,
                  message: '请输入电话号码!',
                },
              ]}
            />
          </>
        )}
      </LoginFormPage>
    </div>
  );
};

export default () => {
  return (
    <ProConfigProvider dark>
      <Page />
    </ProConfigProvider>
  );
};