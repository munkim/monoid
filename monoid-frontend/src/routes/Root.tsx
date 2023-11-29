import { FC, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Modal from 'src/components/0100_modal';
import UserContext, { TUser, initialState } from 'src/contexts/User';

const Root: FC = () => {
  const [ user, setUser ] = useState<TUser>( initialState );
  const userContextValue = useMemo(() => ({ user, setUser }), [ user, setUser ]);

  return (
    <UserContext.Provider value={userContextValue}>
      <Outlet />
      <Modal />
    </UserContext.Provider>
  );
};

export default Root;
