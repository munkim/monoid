import { AnimatePresence, motion } from 'framer-motion';
import { FC } from 'react';
import { Outlet } from 'react-router-dom';
import useUserContext from 'src/hooks/useUserContext';
import Login from 'src/sockets/Login';
import PageTitleSocket from 'src/sockets/PageTitleSocket';
import SidebarSocket from 'src/sockets/SidebarSocket';

const Authenticationlayer: FC = () => {
  const { isAppReady, handleLogin, handleFailedLogin } = useUserContext();

  return (
    <div className="overflow-hidden flex flex-nowrap">
      <AnimatePresence mode="wait">
        {isAppReady && (
          <div className="w-full">
            <PageTitleSocket />
            <div className="flex">
              <SidebarSocket />
              <motion.div
                key="dashboard"
                className="p-2 pb-24 md:p-8 max-h-[calc(100vh-50px)] md:max-h-[calc(100vh-59px)] overflow-y-auto mt-[50px] md:mt-[59px] basis-full flex-shrink"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Outlet />
              </motion.div>
            </div>
          </div>
        )}
        {!isAppReady && (
          <motion.div
            key="login"
            className="min-w-[100vw]"
            initial={{ opacity: 0, marginLeft: 32 }}
            animate={{ opacity: 1, marginLeft: 0 }}
            exit={{ opacity: 0, marginLeft: '-100vw' }}
          >
            <Login onLogin={handleLogin} onFailedLogin={handleFailedLogin} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Authenticationlayer;
