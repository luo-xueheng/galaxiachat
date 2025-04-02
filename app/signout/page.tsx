'use client';
import {
  AlipayCircleOutlined,
  LockOutlined,
  MobileOutlined,
  TaobaoCircleOutlined,
  UserOutlined,
  WeiboCircleOutlined,
} from '@ant-design/icons';
import {
  LoginForm,
  ProConfigProvider,
  ProFormCaptcha,
  ProFormCheckbox,
  ProFormText,
  setAlpha,
} from '@ant-design/pro-components';
import { Space, Tabs, message, theme } from 'antd';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { Provider, useSelector, useDispatch } from "react-redux";
import { BACKEND_URL, FAILURE_PREFIX, LOGOUT_SUCCESS,LOGOUT_FAILED,SIGNOUT_SUCCESS,SIGNOUT_FAILED } from "../constants/string";
type signoutType = 'password' | 'email' | 'phone';
import store, { RootState } from "../redux/store";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { token } = theme.useToken();
  const [signoutType, setsignoutType] = useState<signoutType>('phone');
  const userName = useSelector((state: RootState) => state.auth.name);
  const [password, setPassword] = useState("");
  const iconStyles: CSSProperties = {
    marginInlineStart: '16px',
    color: setAlpha(token.colorTextBase, 0.2),
    fontSize: '24px',
    verticalAlign: 'middle',
    cursor: 'pointer',
  };
  const signoutbypassword = async () => {
      fetch(`${BACKEND_URL}/api/signout`, {
        method: "POST",
        body: JSON.stringify({
            userName,
            password,
        }),
    })
        .then((res) => res.json())
        .then((res) => {
            if (Number(res.code) === 0) {
                alert(SIGNOUT_SUCCESS + userName);
                /**
                 * @note 这里假定 login 页面不是首页面，大作业中这样写的话需要作分支判断
                 */
                router.push("/mainpage");
            }
            else {
                alert(SIGNOUT_FAILED);
            }
        })
        .catch((err) => alert(FAILURE_PREFIX + err));
    };

  return (
    <ProConfigProvider hashed={false}>
      <div style={{ backgroundColor: token.colorBgContainer }}>
        <LoginForm
          logo="https://github.githubassets.com/favicons/favicon.png"
          title="Github"
          subTitle="全球最大的代码托管平台"
        >
          <Tabs
            centered
            activeKey={signoutType}
            onChange={(activeKey) => setsignoutType(activeKey as signoutType)}
          >
            <Tabs.TabPane key={'password'} tab={'通过密码注销'} />
            <Tabs.TabPane key={'email'} tab={'通过邮箱注销'} />
            <Tabs.TabPane key={'phone'} tab={'通过手机注销'} />
          </Tabs>
          {signoutType === 'password' && (
            <>
              <ProFormText
                name="username"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined className={'prefixIcon'} />,
                }}
                placeholder={'密码：'}
                rules={[
                  {
                    required: true,
                    message: '请输入密码!',
                  },
                ]}
              />
            </>
          )}
          {signoutType === 'email' && (
            <>
              <ProFormText
                fieldProps={{
                  size: 'large',
                  prefix: <MobileOutlined className={'prefixIcon'} />,
                }}
                name="mobile"
                placeholder={'手机号'}
                rules={[
                  {
                    required: true,
                    message: '请输入手机号！',
                  },
                  {
                    pattern: /^1\d{10}$/,
                    message: '手机号格式错误！',
                  },
                ]}
              />
              <ProFormCaptcha
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined className={'prefixIcon'} />,
                }}
                captchaProps={{
                  size: 'large',
                }}
                placeholder={'请输入验证码'}
                captchaTextRender={(timing, count) => {
                  if (timing) {
                    return `${count} ${'获取验证码'}`;
                  }
                  return '获取验证码';
                }}
                name="captcha"
                rules={[
                  {
                    required: true,
                    message: '请输入验证码！',
                  },
                ]}
                onGetCaptcha={async () => {
                  message.success('获取验证码成功！验证码为：1234');
                }}
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
        </LoginForm>
      </div>
    </ProConfigProvider>
  );
};