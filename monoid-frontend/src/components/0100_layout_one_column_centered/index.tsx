import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, PropsWithChildren } from 'react';

interface IProps extends PropsWithChildren {
  className?: string;
  extendXl?: boolean;
}

const LayoutOneColumnCentered: FC<IProps> = ({
  className,
  extendXl,
  children,
}) => (
  <AnimatePresence>
    <motion.div
      className={clsx( 'flex justify-center w-full', className )}
      initial={{ opacity: 0, marginLeft: 32 }}
      animate={{ opacity: 1, marginLeft: 0 }}
      exit={{ opacity: 0, marginLeft: '-100vw' }}
    >
      <div
        className={clsx(
          'w-full max-w-[512px]',
          extendXl && 'xl:max-w-[1280px]',
        )}
      >
        {children}
      </div>
    </motion.div>
  </AnimatePresence>
);

export default LayoutOneColumnCentered;
