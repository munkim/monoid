import { FC } from 'react';
import ActionTesting from 'src/components/action_testing';

import APITesting from 'src/components/api_testing';

const APITestingSocket: FC = () => (
  <div className="w-full bg-white">
    <APITesting />
    <ActionTesting />
  </div>
);

export default APITestingSocket;
