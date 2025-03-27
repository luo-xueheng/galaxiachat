import React from 'react';
import { Button } from 'antd';
import Link from 'next/link';
import { metadata } from "./metadata"; // 引入 metadata


const Home = () => (
  <div className="App" style={{
    display: 'flex',           // 启用 Flexbox 布局
    flexDirection: 'column',   // 设置垂直排列
    justifyContent: 'center',  // 垂直居中
    alignItems: 'center',      // 水平居中
    height: '50vh',            // 设置高度
    padding: '0 20px'          // 内边距
  }}>
    {/* 上面部分：图标和欢迎语 */}
    <div style={{
      display: 'flex', 
      alignItems: 'center',  // 垂直居中图标和文本
      flexDirection: 'column', // 垂直排列
      textAlign: 'center'    // 使文本居中
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