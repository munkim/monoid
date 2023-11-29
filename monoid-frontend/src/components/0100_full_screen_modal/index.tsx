import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, PropsWithChildren } from 'react';
import { useOutsideClickRef } from 'rooks';

interface IProps {
  isOpen?: boolean;
  hideClose?: boolean;
  onClose: () => void;
}

const FullScreenModal: FC<PropsWithChildren<IProps>> = ({
  isOpen = true,
  hideClose = false,
  children,
  onClose,
}) => {
  const [ ref ] = useOutsideClickRef( onClose );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 z-50 w-screen h-screen bg-gray-900 bg-opacity-75"
        >
          <div className="flex items-center justify-center w-full h-full">
            <div ref={ref} className="rounded bg-monoid-100 drop-shadow-lg">
              {children}
              {!hideClose && (
                <button
                  type="button"
                  className="absolute top-4 right-4"
                  onClick={onClose}
                >
                  <FontAwesomeIcon
                    icon={faTimes}
                    className="text-xl cursor-pointer"
                  />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullScreenModal;
