import React from 'react';
import { Layout, Menu } from 'antd';
import {
  HomeOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  UserOutlined,
  CreditCardOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import type { MenuProps } from 'antd';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem('首页', '/', <HomeOutlined />),
  getItem('服务中心', '/services', <AppstoreOutlined />),
  getItem('我的任务', '/tasks', <UnorderedListOutlined />),
  getItem('个人中心', '/profile', <UserOutlined />),
  getItem('积分管理', '/credits', <CreditCardOutlined />),
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Sider
      style={{
        position: 'fixed',
        left: 0,
        top: 64,
        height: 'calc(100vh - 64px)',
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
      }}
      width={200}
    >
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        style={{
          height: '100%',
          borderRight: 0,
        }}
        items={items}
        onClick={handleMenuClick}
      />
    </Sider>
  );
};

export default Sidebar;