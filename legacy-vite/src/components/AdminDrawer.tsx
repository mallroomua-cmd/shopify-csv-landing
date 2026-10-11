import React from 'react';
import { AdminControlHub } from './AdminControlHub';

/**
 * AdminDrawer now acts as a backwards-compatible wrapper around the ultimate AdminControlHub
 */
export const AdminDrawer: React.FC = () => {
  return <AdminControlHub />;
};

export default AdminDrawer;
