import APIContext, { TParam, initialState } from 'src/contexts/API';
import { FC, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';

const APILayer: FC = () => {
  const [ param, setParam ] = useState<TParam[]>( initialState );
  const apiContextValue = useMemo(
    () => ({ param, setParam }),
    [ param, setParam ],
  );

  return (
    <APIContext.Provider value={apiContextValue}>
      <Outlet />
    </APIContext.Provider>
  );
};

export default APILayer;
