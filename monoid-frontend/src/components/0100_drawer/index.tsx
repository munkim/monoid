import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, PropsWithChildren } from 'react';
import { useOutsideClickRef } from 'rooks';

interface IProps {
  isOpen?: boolean;
  onClose: () => void;
}

const Drawer: FC<PropsWithChildren<IProps>> = ({
  isOpen = true,
  children,
  onClose,
}) => {
  const [ ref ] = useOutsideClickRef(() => onClose());

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-screen h-screen fixed top-0 left-0 z-50 bg-monoid-100/75"
        >
          <motion.div
            ref={ref}
            className="absolute top-1/4 h-3/4 md:top-1/2 md:h-1/2 w-screen bg-monoid-100 drop-shadow-up"
            initial={{ y: '100vh', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100vh', opacity: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="absolute top-0 right-0">
              <FontAwesomeIcon
                icon={faTimes}
                className="fa-fw text-4xl px-1 py-2 cursor-pointer"
                onClick={onClose}
              />
            </div>
            <div className="h-full overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Drawer;
