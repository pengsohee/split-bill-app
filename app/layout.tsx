import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import 'antd/dist/reset.css';

const RootLayout = ({ children }: { children: React.ReactNode }) => (
    <html lang="en">
        <head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@400;500;700&display=swap" rel="stylesheet" />
        </head>
        <body>
            <AntdRegistry>
                {/* The theme prop has been removed to disable the global dark theme */}
                <ConfigProvider>
                {children}
                </ConfigProvider>
            </AntdRegistry>
        </body>
    </html>
);

export default RootLayout;
