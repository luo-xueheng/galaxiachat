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
import { BACKEND_URL, FAILURE_PREFIX, LOGIN_FAILED, LOGIN_SUCCESS_PREFIX,REGISTER_FAILED,REGISTER_SUCCESS_PREFIX,REGISTER_REQUIRED} from "../constants/string";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from "react-redux";
import { setName, setToken } from "../redux/auth";
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
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
  const dispatch = useDispatch();
  const register = async () => {
    console.log("userName"+userName)
    fetch(`${BACKEND_URL}/api/register`, {
          method: "POST",
          body: JSON.stringify({
              userName,
              password,
              email,
              phone,
          }),
      })
          .then((res) => res.json())
          .then((res) => {
              if (Number(res.code) === 0) {
                  dispatch(setToken(res.token));
                  dispatch(setName(userName));
                    // 存储 token
                  localStorage.setItem("token", res.token);
                  localStorage.setItem("userName", userName);
                  alert(REGISTER_SUCCESS_PREFIX + userName);
                  /**
                   * @note 这里假定 login 页面不是首页面，大作业中这样写的话需要作分支判断
                   */
                  router.push("/mainpage");
              }
              else {
                  alert(REGISTER_FAILED);
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
        backgroundVideoUrl="https://gw.alipayobjects.com/v/huamei_gcee1x/afts/video/jXRBRK_VAwoAAAAAAAAAAAAAK4eUAQBr"
        title="Instant Message"
        containerStyle={{
          backgroundColor: 'rgba(0, 0, 0,0.65)',
          backdropFilter: 'blur(4px)',
        }}
        subTitle="好用的即时通讯系统"
        submitter={{
          searchConfig: {
            submitText: '注册',
          },
        }}
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
              placeholder={'用户名: '}
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
              placeholder={'密码:'}
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
              placeholder={'邮箱: '}
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
              placeholder={'电话号码: '}
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