'use client';

import React, { useEffect, useState } from 'react';
import {
    Avatar, Card, Col, Descriptions, Form,
    Input, Row, Button, message, Divider,
    Typography, Space, Spin, Upload,
} from 'antd';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';

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

    const [token, setToken] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    // 读取 localStorage 中的用户信息
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedToken = localStorage.getItem("token");
            const storedUserName = localStorage.getItem("userName");
            setToken(storedToken);
            setUserName(storedUserName);
        }
    }, []);
    
    // 🎯 获取用户信息
    const fetchProfile = async () => {
        try {
            if (!userName || !token) {
                message.error('未登录或 token 缺失');
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
                message.error('获取用户信息失败：' + data.info);
            }

        } catch (error) {
            message.error('获取用户信息失败');
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

    const handleBasicFinish = async (values: any) => {
        console.log('提交基本信息：', values);

        if (!token || !userName) {
            message.error('未登录或 token 缺失');
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
            message.error('请求出错，请稍后再试');
        }
    };

    const handleSensitiveFinish = (values: any) => {
        console.log('验证旧密码并修改：', values);
        message.success('邮箱和手机号已更新');
    };

    const handlePasswordChange = (values: any) => {
        console.log('修改密码：', values);
        message.success('密码修改成功');
        passwordForm.resetFields();
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
                                    <div onClick={handleManualUploadClick} style={{ cursor: 'pointer' }}>
                                        {userInfo && userInfo.avatar ? (
                                            <Avatar
                                                size={120}
                                                src={`https://2025-backend-galaxia-galaxia.app.spring25b.secoder.net${userInfo.avatar}`}
                                            />
                                        ) : (
                                            <div>
                                                <PlusOutlined />
                                                <div style={{ marginTop: 8 }}>上传新头像</div>
                                            </div>
                                        )}
                                    </div>
                                </Spin>
                            </Upload>

                            <Title level={4} style={{ marginTop: 16 }}>
                                {userInfo.userName}
                            </Title>
                            
                            <Descriptions column={1} bordered size="small">
                                <Descriptions.Item label="昵称">{userInfo.nickName}</Descriptions.Item>
                                <Descriptions.Item label="邮箱">{userInfo.email}</Descriptions.Item>
                                <Descriptions.Item label="手机号">{userInfo.phone}</Descriptions.Item>
                            </Descriptions>
                        </Space>
                    </Card>
                </Col>

                {/* 右侧编辑信息 */}
                <Col span={16}>
                    <Card title="基本信息设置">
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="用户名">{userInfo.userName}</Descriptions.Item>
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

                    <Card title="敏感信息修改">
                        {editingSensitive ? (
                            <Form layout="vertical" onFinish={handleSensitiveFinish}>
                                <Form.Item label="旧密码" name="oldPassword" rules={[{ required: true, message: '请输入旧密码' }]}>
                                    <Input.Password />
                                </Form.Item>
                                <Form.Item label="新邮箱" name="newEmail" rules={[{ type: 'email', required: true }]}>
                                    <Input />
                                </Form.Item>
                                <Form.Item label="新手机号" name="newPhone" rules={[{ required: true }]}>
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