'use client';

import { ProForm, ProFormItem } from '@ant-design/pro-components';
import { Input, Flex, Upload, Avatar, message } from 'antd';
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
            
            {/* 昵称 */}
                <Input placeholder="Basic usage" />
                              
            
        </div>
    );
};

export default EditProfilePage;