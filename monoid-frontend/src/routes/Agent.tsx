import { FC } from 'react';
import { Outlet } from 'react-router-dom';

const Agent: FC = () => (
  <div className="w-full">
    <Outlet />
  </div>
);

export default Agent;
