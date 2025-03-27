import React from 'react';
import { Button } from 'antd';
import Link from 'next/link';
import { metadata } from "./metadata"; // 引入 metadata


const Home = () => (
  <div className="App" style={{
    display: 'flex',            // 启用 Flexbox 布局
    flexDirection: 'column',    // 设置垂直排列
    justifyContent: 'center',   // 垂直居中
    alignItems: 'center',       // 水平居中
    height: '100vh',             // 设置高度
    padding: '0 20px',          // 内边距
    backgroundColor: '#f5f5f5', // 背景色（浅灰色）
    borderRadius: '10px',       // 圆角边框
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', // 添加阴影效果
    border: '1px solid #ddd',   // 浅灰色边框
    width: '80%',               // 使容器宽度适中
    margin: '0 auto',           // 居中显示
  }}>
    {/* 上面部分：图标和欢迎语 */}
    <div style={{
      display: 'flex', 
      alignItems: 'center',  // 垂直居中图标和文本
      flexDirection: 'column', // 垂直排列
      textAlign: 'center',    // 使文本居中
      height: '50vh', width: '100%',
      marginTop: 150,
    }}>
      <img src="/images/logo_tmp.png" alt="Logo" style={{ width: 150, height: 150, marginBottom: 10 }} /> {/* 图标 */}
      <div style={{ fontSize: '48px', fontWeight: 'bold' }}>
        Welcome to Galaxia Chat!
      </div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'gray'}}>
        Your Universe of Infinite Conversations.
      </div>
    </div>

    {/* 下面部分：按钮 */}
    <div style={{ marginTop: 20 }}>
      {/* 导航到log in */}
      <Link href="/login">
        <Button color="purple" variant="solid" style={{ marginRight: '10px' }}>
          Log in
        </Button>
      </Link>
      {/* 导航到sign up */}
      <Link href="/register">
        <Button color="purple" variant="outlined">
          Sign up
        </Button>
      </Link>
    </div>
  </div>
);


export default Home;