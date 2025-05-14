'use client';

import React, { useEffect, useState } from 'react';
import {
    Avatar, Card, Col, Descriptions, Form,
    Input, Row, Button, message, Divider,
    Typography, Space, Spin, Upload, Popconfirm
} from 'antd';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { setName, setToken } from "../../redux/auth";
import {
    BACKEND_URL,
    FAILURE_PREFIX,
    LOGOUT_SUCCESS,
    LOGOUT_FAILED,
} from "../../constants/string";

const { Title, Text } = Typography;

interface UserProfile {
    avatar: string;
    userName: string;
    nickName: string | null;
    email: string;
    phone: string;
}

export default function ProfilePage() {
    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [editingSensitive, setEditingSensitive] = useState(false);
    const [userInfo, setUserInfo] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const [token, setLocalToken] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    // 读取 localStorage 中的用户信息
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedToken = localStorage.getItem("token");
            const storedUserName = localStorage.getItem("userName");
            setLocalToken(storedToken);
            setUserName(storedUserName);
        }
    }, []);
    
    // 🎯 获取用户信息
    const fetchProfile = async () => {
        try {
            if (!userName || !token) {
                alert('未登录或 token 缺失');
                setLoading(false);
                return;
            }

            const res = await fetch(`/api/user_profile/?userName=${userName}`, {
                headers: {
                    Authorization: token,
                },
            });

            const data = await res.json();
            console.log('用户信息:', data);
            if (data.code === 0) {
                const user: UserProfile = {
                    userName: data.name,
                    nickName: data.nickname,
                    email: data.email,
                    phone: data.phone,
                    avatar: data.avatar,
                };
                setUserInfo(user);
                form.setFieldsValue({ nickName: user.nickName });
            } else {
                alert('获取用户信息失败：' + data.info);
            }

        } catch (error) {
            alert('获取用户信息失败');
            console.error(error);
        } finally {
            setLoading(false); // 无论成功失败，都关闭 loading 状态
        }
    };

    // 用户信息准备好后调用
    useEffect(() => {
        if (token && userName) {
            fetchProfile();
        }
    }, [token, userName]);

    // 🎯 头像上传
    const [uploading, setUploading] = useState(false);
    const handleManualUploadClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png, image/jpeg';
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;

            const isTooLarge = file.size > 10 * 1024 * 1024;
            if (isTooLarge) {
                alert('图片不能超过10MB');
                return;
            }

            setUploading(true);
            const formData = new FormData();
            formData.append('newAvatar', file);
            formData.append('userName', userName || '');

            try {
                const res = await fetch('/api/edit_profile/', {
                    method: 'POST',
                    headers: {
                        Authorization: token || '',
                    },
                    body: formData,
                });

                if (!res.ok) throw new Error('上传失败');
                const data = await res.json();
                alert('头像上传成功');
                fetchProfile(); // 刷新用户信息
            } catch (err) {
                alert('上传失败，请重试');
            } finally {
                setUploading(false);
            }
        };
        input.click();
    };

    // 🎯 修改昵称
    const handleBasicFinish = async (values: any) => {
        console.log('提交基本信息：', values);

        if (!token || !userName) {
            alert('未登录或 token 缺失');
            return;
        }

        const formData = new FormData();
        formData.append('userName', userName);
        formData.append('newNickname', values.nickName);

        try {
            const res = await fetch('/api/edit_profile/', {
                method: 'POST',
                headers: {
                    Authorization: token || '',
                },
                body: formData,
            });
            console.log("请求体：", formData);
            if (res.ok) {
                alert('昵称更新成功');
                fetchProfile(); // 刷新用户信息
            } else {
                alert('昵称更新失败');
            }
        } catch (error) {
            console.error('修改昵称时出错:', error);
            alert('请求出错，请稍后再试');
        }
    };

    // 🎯 修改邮箱和手机号
    const handleSensitiveFinish = async (values: any) => {
        console.log('验证旧密码并修改：', values);

        if (!token || !userName) {
            alert('未登录或 token 缺失');
            return;
        }

        if (!values.newEmail && !values.newPhone) {
            alert('请至少填写一个需要修改的项（邮箱或手机号）');
            return;
        }

        const formData = new FormData();
        formData.append('userName', userName);
        formData.append('password', values.oldPassword);

        if (values.newEmail) {
            formData.append('newEmail', values.newEmail);
        }

        if (values.newPhone) {
            formData.append('newPhone', values.newPhone);
        }

        // 输出调试
        for (const [k, v] of formData.entries()) {
            console.log(`formData: ${k} = ${v}`);
        }

        try {
            const res = await fetch('/api/edit_profile/', {
                method: 'POST',
                headers: {
                    Authorization: token,
                },
                body: formData,
            });

            const data = await res.json();
            if (data.code === 0) {
                alert('邮箱 / 手机号已更新');
                setEditingSensitive(false);
                fetchProfile(); // 刷新用户信息
            } else {
                alert('更新失败：' + data.info);
            }
        } catch (error) {
            console.error('修改敏感信息时出错:', error);
            alert('请求出错，请稍后再试');
        }
    };

    // 🎯 修改密码
    const handlePasswordChange = async (values: any) => {
        console.log('修改密码：', values);

        if (!token || !userName) {
            alert('未登录或 token 缺失');
            return;
        }

        const formData = new FormData();
        formData.append('userName', userName);
        formData.append('password', values.oldPassword);
        formData.append('newPassword', values.newPassword);

        try {
            const res = await fetch('/api/edit_profile/', {
                method: 'POST',
                headers: {
                    Authorization: token,
                },
                body: formData,
            });

            const data = await res.json();
            if (data.code === 0) {
                alert('密码修改成功');
                passwordForm.resetFields();
            } else {
                alert('修改失败：' + data.info);
            }
        } catch (error) {
            console.error('修改密码时出错:', error);
            alert('请求出错，请稍后再试');
        }
    };

    if (loading) {
        console.log('Loading user info...');
        return (
            <div style={{ textAlign: 'center', paddingTop: 100 }}>
                <Spin size="large" tip="加载用户信息中..." />
            </div>
        );
    }

    if (!userInfo) {
        return (
            <div style={{ textAlign: 'center', paddingTop: 100 }}>
                <Text type="danger">无法加载用户信息，请稍后重试。</Text>
            </div>
        );
    }

    // 🎯 登出
    const router = useRouter();
    const dispatch = useDispatch();
    const logout = async () => {
        const token = localStorage.getItem("token");
        try {
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
                dispatch(setToken(null)); // Redux action remains unchanged
                localStorage.removeItem("token");
                localStorage.removeItem("userName");
                router.push("/");
            } else {
                alert(FAILURE_PREFIX + (data.message || LOGOUT_FAILED));
            }
        } catch (error) {
            alert(FAILURE_PREFIX + error);
        }
    };

    // 🎯 注销账号
    const handleSignout = () => {
        router.push('/signout');
    };

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2}>个人信息</Title>
            <Row gutter={24}>
                {/* 左侧展示信息 */}
                <Col span={8}>
                    <Card>
                        <Space direction="vertical" align="center" style={{ width: '100%' }}>
                            <Upload
                                showUploadList={false}
                                customRequest={() => { }} // 禁用 Upload 默认上传
                            >
                                <Spin spinning={uploading}>
                                    <div className="avatar-wrapper" onClick={handleManualUploadClick} style={{ cursor: 'pointer', position: 'relative' }}>
                                        {userInfo && userInfo.avatar ? (
                                            <>
                                                <Avatar
                                                    size={120}
                                                    src={`https://2025-backend-galaxia-galaxia.app.spring25b.secoder.net${userInfo.avatar}`}
                                                    style={{ transition: '0.3s' }}
                                                />
                                                <div className="avatar-overlay">点击更换头像</div>
                                            </>
                                        ) : (
                                            <div>
                                                <PlusOutlined />
                                                <div style={{ marginTop: 8 }}>上传新头像</div>
                                            </div>
                                        )}
                                    </div>
                                </Spin>
                            </Upload>
                            <Typography.Text type="secondary">点击上传新头像</Typography.Text>

                            <Title level={4} style={{ marginTop: 16 }}>
                                {userInfo.userName}
                            </Title>
                            
                            <Descriptions column={1} bordered size="small">
                                <Descriptions.Item label="昵称">{userInfo.nickName}</Descriptions.Item>
                                <Descriptions.Item label="邮箱">{userInfo.email}</Descriptions.Item>
                                <Descriptions.Item label="手机号">{userInfo.phone}</Descriptions.Item>
                            </Descriptions>
                        </Space>
                        <div style={{ textAlign: 'center', marginTop: 24 }}>
                            <Space>
                                <Button type="primary" danger onClick={logout}>
                                    退出登录
                                </Button>
                                {/* 注销确认弹窗 */}
                                <Popconfirm
                                    title="确定要注销账号吗？"
                                    onConfirm={handleSignout}
                                    okText="是"
                                    cancelText="否"
                                >
                                    <Button danger>
                                        注销账号
                                    </Button>
                                </Popconfirm>
                            </Space>
                        </div>
                    </Card>
                </Col>

                {/* 右侧编辑信息 */}
                <Col span={16}>
                    {/* 修改昵称 */}
                    <Card title="基本信息设置">
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="昵称">{userInfo.nickName}</Descriptions.Item>
                            <Descriptions.Item label="邮箱">{userInfo.email}</Descriptions.Item>
                            <Descriptions.Item label="手机号">{userInfo.phone}</Descriptions.Item>
                        </Descriptions>

                        <Divider />

                        <Form layout="vertical" form={form} onFinish={handleBasicFinish}>
                            <Form.Item label="昵称" name="nickName">
                                <Input placeholder="请输入昵称" />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit">保存昵称</Button>
                            </Form.Item>
                        </Form>
                    </Card>

                    <Divider />

                    {/* 修改邮箱及电话 */}
                    <Card title="敏感信息修改">
                        {editingSensitive ? (
                            <Form layout="vertical" onFinish={handleSensitiveFinish}>
                                <Form.Item label="旧密码" name="oldPassword" rules={[{ required: true, message: '请输入旧密码' }]}>
                                    <Input.Password />
                                </Form.Item>
                                <Form.Item label="新邮箱" name="newEmail" rules={[{ type: 'email', required: false }]}>
                                    <Input />
                                </Form.Item>
                                <Form.Item label="新手机号" name="newPhone" rules={[{ required: false }]}>
                                    <Input />
                                </Form.Item>
                                <Form.Item>
                                    <Space>
                                        <Button type="primary" htmlType="submit">保存</Button>
                                        <Button onClick={() => setEditingSensitive(false)}>取消</Button>
                                    </Space>
                                </Form.Item>
                            </Form>
                        ) : (
                            <Button onClick={() => setEditingSensitive(true)}>修改邮箱和手机号</Button>
                        )}
                    </Card>

                    <Divider />

                    {/* 修改密码 */}
                    <Card title="修改密码">
                        <Form layout="vertical" form={passwordForm} onFinish={handlePasswordChange}>
                            <Form.Item label="旧密码" name="oldPassword" rules={[{ required: true, message: '请输入旧密码' }]}>
                                <Input.Password />
                            </Form.Item>
                            <Form.Item label="新密码" name="newPassword" rules={[{ required: true, message: '请输入新密码' }]}>
                                <Input.Password />
                            </Form.Item>
                            <Form.Item label="确认新密码" name="confirmNewPassword" dependencies={["newPassword"]} rules={[
                                { required: true, message: '请确认新密码' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('newPassword') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('两次输入的密码不一致'));
                                    },
                                }),
                            ]}>
                                <Input.Password />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit">修改密码</Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}