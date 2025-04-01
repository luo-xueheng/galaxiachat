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
//import { useRouter } from 'next/compat/router'; // 引入 useRouter
import{ useRouter } from 'next/navigation'; // 使用新的 useRouter
import { useEffect } from 'react';
import { setName, setToken } from "../redux/auth";
import { useDispatch } from "react-redux";
type LoginType = 'account';

const iconStyles: CSSProperties = {
  color: 'rgba(0, 0, 0, 0.2)',
  fontSize: '18px',
  verticalAlign: 'middle',
  cursor: 'pointer',
};

const Page = () => {
  const [loginType, setLoginType] = useState<LoginType>('account');
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const { token } = theme.useToken();
  const router = useRouter();
  const dispatch = useDispatch();
  const login = async () => {
    fetch(`${BACKEND_URL}/api/login`, {
      method: "POST",
      body: JSON.stringify({
          userName,
          password,
      }),
  })
      .then((res) => res.json())
      .then((res) => {
          if (Number(res.code) === 0) {
              // Step 4 BEGIN
              dispatch(setToken(res.token));
              // Step 4 END
              dispatch(setName(userName));
              alert(LOGIN_SUCCESS_PREFIX + userName);
              /**
               * @note 这里假定 login 页面不是首页面，大作业中这样写的话需要作分支判断
               */
              router.push("/mainpage");
          }
          else {
              alert(LOGIN_FAILED);
          }
      })
      .catch((err) => alert(FAILURE_PREFIX + err));
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
        //backgroundVideoUrl="https://gw.alipayobjects.com/v/huamei_gcee1x/afts/video/jXRBRK_VAwoAAAAAAAAAAAAAK4eUAQBr"
        title="Instant Message"
        containerStyle={{
          backgroundColor: 'rgba(0, 0, 0,0.65)',
          backdropFilter: 'blur(4px)',
        }}
        subTitle="好用的即时通讯系统"
        onFinish={async () => {
          await login(); // 表单提交时触发登录请求
        }}
      >
        <Tabs
          centered
          activeKey={loginType}
          onChange={(activeKey) => setLoginType(activeKey as LoginType)}
        >
          <Tabs.TabPane key={'account'} tab={'账号密码登录'} />
        </Tabs>
        {loginType === 'account' && (
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
          </>
        )}
        <div
          style={{
            marginBlockEnd: 24,
          }}
        >
          <ProFormCheckbox noStyle name="autoLogin">
            自动登录
          </ProFormCheckbox>
          <a
            style={{
              float: 'right',
            }}
          >
            忘记密码
          </a>
        </div>
        {/* 添加跳转到注册页面的按钮 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: 24,
          }}
        >
          <Button
            type="link"
            onClick={() => router.push('/register')} // 跳转到注册页面
          >
            没有账号？立即注册
          </Button>
        </div>
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