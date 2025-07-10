import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import 'antd/dist/reset.css';
import { lexend_deca } from '@/lib/fonts';

const RootLayout = ({ children }: { children: React.ReactNode }) => (
    <html lang="en" className={lexend_deca.className}>
        <head>
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
