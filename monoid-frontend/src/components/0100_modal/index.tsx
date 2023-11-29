import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, useContext, useEffect, useState } from 'react';
import { useIntervalWhen } from 'rooks';
import UserContext from 'src/contexts/User';

const Modal: FC = () => {
  const { user, setUser } = useContext( UserContext );
  const [ isOpen, setIsOpen ] = useState( false );

  useIntervalWhen(
    () => {
      setUser( x => ({ ...x, activeModal: null }));
      setIsOpen( false );
    },
    2500,
    isOpen,
  );

  useEffect(() => {
    if ( user.activeModal ) {
      setIsOpen( true );
    }
  }, [ user.activeModal ]);

  return (
    <div className="fixed top-8 w-screen z-50" style={{ height: 0 }}>
      <div className="flex justify-center">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="modal"
              className={clsx( 'w-[320px] rounded text-monoid-100', {
                'bg-red-600': user.activeModal?.type === 'error',
                'bg-lime-600': user.activeModal?.type === 'success',
              })}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -32 }}
              onClick={() => setIsOpen( false )}
            >
              <div className="font-bold py-2 px-4 border-b border-monoid-300">
                {user.activeModal?.title}
              </div>
              <div className="p-4">{user.activeModal?.children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Modal;
