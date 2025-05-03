'use client';

import { ProForm, ProFormItem } from '@ant-design/pro-components';
import { Input, Flex, Upload, Avatar, message, Button } from 'antd';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { setName, setAvatar, setEmail, setPhone } from '../redux/auth';
import type { GetProp, UploadProps } from 'antd';

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

const EditProfilePage = () => {
    const state = useSelector((state: any) => state);
    console.log('Redux State:', state);

    // 从 Redux Store 获取 token
    const token = useSelector((state: any) => state.auth.token);
    console.log('Token:', token); // 打印 token，检查是否正确
    const username = useSelector((state: any) => state.auth.name);
    const avatar = useSelector((state: any) => state.auth.avatar);
    console.log('Avatar:', avatar); // 打印头像，检查是否正确

    const dispatch = useDispatch();
    // 获取用户信息
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await fetch('/api/user_profile/?userName=' + username, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                console.log(response); // 打印响应，检查是否正确

                if (!response.ok) {
                    throw new Error('获取用户信息失败');
                }

                const data = await response.json();
                console.log('用户信息获取成功:', data); // 打印用户信息，检查是否正确

                // 用 Redux 存入全局状态
                dispatch(setName(data.name));
                dispatch(setAvatar(data.avatar));
                dispatch(setEmail(data.email));
                dispatch(setPhone(data.phone));
            } catch (error) {
                message.error('无法加载用户信息');
                console.error('获取用户信息失败:', error);
            }
        };

        fetchUserProfile();
    }, [token]);

    const getBase64 = (img: FileType, callback: (url: string) => void) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => callback(reader.result as string));
        reader.readAsDataURL(img);
    };

    const beforeUpload = (file: FileType) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        console.log(isJpgOrPng);
        console.log(file.type);
        if (!isJpgOrPng) {
            console.error('You can only upload JPG/PNG file!');
            alert('You can only upload JPG/PNG file!');
        }
        const isLt10M = file.size / 1024 / 1024 < 10;
        if (!isLt10M) {
            console.error('Image must smaller than 10MB!');
            alert('Image must smaller than 10MB!');
        }
        return isJpgOrPng && isLt10M;
    };

    // 上传头像
    const handleUpload = async (option: any) => {
        const file = option.file as File
        const formData = new FormData();
        formData.append('newAvatar', file); // 使用 newAvatar 字段上传文件
        formData.append('userName', username || ''); // 添加用户名到表单数据

        try {
            const response = await fetch('/api/edit_profile/', {
                method: 'POST',
                headers: {
                    Authorization: `${token}`, // 添加 token
                },
                body: formData,
            });

            console.log(token); // 打印 token，检查是否正确
            console.log(formData); // 打印 FormData，检查是否正确
            console.log(response); // 打印响应，检查是否正确

            if (!response.ok) {
                throw new Error('上传失败');
            }

            const data = await response.json();
            console.log('头像上传成功:', data); // 打印上传结果，检查是否正确
            alert('头像上传成功');
        } catch (error) {
            alert('头像上传失败，请重试');
        }
    };

    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string>();

    const handleChange: UploadProps['onChange'] = (info) => {
        if (info.file.status === 'uploading') {
            setLoading(true);
            return;
        }
        if (info.file.status === 'done') {
            // Get this url from response in real world.
            getBase64(info.file.originFileObj as FileType, (url) => {
                setLoading(false);
                setImageUrl(url);
            });
        }
    };

    const handleUsernameChange = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        const newName = e.currentTarget.value;
        console.log('New Name:', newName); // 打印新昵称，检查是否正确

        const formData = new FormData();
        formData.append('newUserName', newName); // 使用 newUserName 字段上传文件
        formData.append('userName', username || ''); // 添加用户名到表单数据
        try {
            const response = await fetch('/api/edit_profile/', {
                method: 'POST',
                headers: {
                    Authorization: `${token}`, // 添加 token
                },
                body: formData,
            });

            console.log(response); // 打印响应，检查是否正确

            if (!response.ok) {
                throw new Error('修改昵称失败');
            }

            const data = await response.json();
            console.log('昵称修改成功:', data); // 打印修改结果，检查是否正确
            alert('昵称修改成功');
        } catch (error) {
            alert('昵称修改失败，请重试');
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault(); // 阻止表单默认提交行为

        // 获取输入值
        const oldPassword = (document.getElementById('oldPassword') as HTMLInputElement).value;
        const newPassword = (document.getElementById('newPassword') as HTMLInputElement).value;
        const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;

        // 前端验证
        if (!oldPassword || !newPassword || !confirmPassword) {
            alert('请填写所有密码字段');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('两次输入的新密码不一致');
            return;
        }

        if (newPassword.length < 8) {
            alert('密码长度至少8位');
            return;
        }

        console.log('正在修改密码...');

        const formData = new FormData();
        formData.append('userName', username || ''); // 当前用户名
        formData.append('password', oldPassword);    // 旧密码（用于验证）
        formData.append('newPassword', newPassword); // 新密码

        try {
            const response = await fetch('/api/edit_profile/', {
                method: 'POST',
                headers: {
                    Authorization: `${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '密码修改失败');
            }

            const data = await response.json();
            console.log('密码修改成功:', data);
            alert('密码修改成功！请重新登录');
            // 通常修改密码后需要重新登录
            // logout(); // 假设有登出函数
        } catch (error) {
            console.error('密码修改错误:', error);
            alert(error.message || '密码修改失败，请检查旧密码是否正确');
        }
    };

    const handleEmailChange = async (e: React.FormEvent) => {
        e.preventDefault();

        const oldPassword = (document.getElementById('email-oldPassword') as HTMLInputElement).value;
        const newEmail = (document.getElementById('newEmail') as HTMLInputElement).value;

        // 前端基础验证
        if (!oldPassword || !newEmail) {
            alert('请填写所有必填字段');
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(newEmail)) {
            alert('请输入有效的邮箱地址');
            return;
        }

        const formData = new FormData();
        formData.append('userName', username || '');
        formData.append('password', oldPassword); // 旧密码验证
        formData.append('newEmail', newEmail);

        try {
            const response = await fetch('/api/edit_profile/', {
                method: 'POST',
                headers: {
                    Authorization: `${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '邮箱修改失败');
            }

            alert('邮箱修改成功！');
            // 可选：发送验证邮件
        } catch (error) {
            console.error('邮箱修改错误:', error);
            alert(error.message || '邮箱修改失败，请检查密码是否正确');
        }
    };
    const handlePhoneChange = async (e: React.FormEvent) => {
        e.preventDefault();

        const oldPassword = (document.getElementById('phone-oldPassword') as HTMLInputElement).value;
        const newPhone = (document.getElementById('newPhone') as HTMLInputElement).value;

        // 前端基础验证
        if (!oldPassword || !newPhone) {
            alert('请填写所有必填字段');
            return;
        }

        if (!/^[0-9]{11}$/.test(newPhone)) {
            alert('请输入11位有效手机号');
            return;
        }

        const formData = new FormData();
        formData.append('userName', username || '');
        formData.append('password', oldPassword); // 旧密码验证
        formData.append('newPhone', newPhone);

        try {
            const response = await fetch('/api/edit_profile/', {
                method: 'POST',
                headers: {
                    Authorization: `${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '手机号修改失败');
            }

            alert('手机号修改成功！');
        } catch (error) {
            console.error('手机号修改错误:', error);
            alert(error.message || '手机号修改失败，请检查密码是否正确');
        }
    };


    return (
        <div style={{ padding: 24, maxWidth: 600, margin: 'auto', background: '#fff', borderRadius: 8 }}>
            <h2 style={{ marginBottom: 24 }}>编辑个人信息</h2>
            {/* 头像上传 */}
            <div>头像</div>
            <Upload
                name="avatar"
                listType="picture-circle"
                className="avatar-uploader"
                showUploadList={false}
                beforeUpload={beforeUpload}
                onChange={handleChange}
                customRequest={handleUpload}
            >
                {avatar ? (
                    <Avatar
                        size={72}
                        src={"https://2025-backend-galaxia-galaxia.app.spring25b.secoder.net" + avatar} />
                ) : (
                    <div>
                        <PlusOutlined />
                        <div style={{ marginTop: 0 }}>上传新头像</div>
                    </div>
                )}
            </Upload>

            {/* 修改昵称 */}
            <div>昵称</div>
            <Input
                defaultValue={username}
                onPressEnter={handleUsernameChange}
            />

            {/* 修改密码 */}
            <div className="password-change-form">
                <h3>修改密码</h3>
                <form onSubmit={handlePasswordChange}>
                    <div>
                        <label>旧密码</label>
                        <Input.Password
                            id="oldPassword"
                            placeholder="请输入当前密码"
                        />
                    </div>
                    <div>
                        <label>新密码</label>
                        <Input.Password
                            id="newPassword"
                            placeholder="至少8位字符"
                            minLength={8}
                        />
                    </div>
                    <div>
                        <label>确认新密码</label>
                        <Input.Password
                            id="confirmPassword"
                            placeholder="再次输入新密码"
                            minLength={8}
                        />
                    </div>
                    <Button type="primary" htmlType="submit">
                        确认修改
                    </Button>
                </form>
            </div>

            {/* 修改邮箱 */}
            <div className="email-change-form">
                <h3>修改邮箱</h3>
                <form onSubmit={handleEmailChange}>
                    <div>
                        <label>当前密码</label>
                        <Input.Password
                            id="email-oldPassword"
                            placeholder="请输入当前密码验证"
                        />
                    </div>
                    <div>
                        <label>新邮箱</label>
                        <Input
                            id="newEmail"
                            type="email"
                            placeholder="example@domain.com"
                        />
                    </div>
                    <Button type="primary" htmlType="submit">
                        确认修改
                    </Button>
                </form>
            </div>

            {/* 修改电话 */}
            <div className="phone-change-form">
                <h3>修改手机号</h3>
                <form onSubmit={handlePhoneChange}>
                    <div>
                        <label>当前密码</label>
                        <Input.Password
                            id="phone-oldPassword"
                            placeholder="请输入当前密码验证"
                        />
                    </div>
                    <div>
                        <label>新手机号</label>
                        <Input
                            id="newPhone"
                            type="tel"
                            placeholder="13800138000"
                            maxLength={11}
                        />
                    </div>
                    <Button type="primary" htmlType="submit">
                        确认修改
                    </Button>
                </form>
            </div>

        </div>
    );
};

export default EditProfilePage;


