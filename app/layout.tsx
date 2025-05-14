"use client"; // 必须添加，因为使用了客户端钩子

import { Geist, Geist_Mono } from "next/font/google";
import Link from 'next/link';
import "./globals.css";

import { useRouter, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "./redux/store";
import { resetAuth } from "./redux/auth";
import Head from "next/head";
import { metadata } from "./metadata"; // 引入 metadata
import Providers from "./providers";
import ClientLayout from "./client/ClientLayout";


// 导入字体
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
          <title>{metadata.title}</title>
          <meta name="description" content={metadata.description} />
          <link rel="icon" href={metadata.icons.icon} />
      </head>
      <body className="antialiased">
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
