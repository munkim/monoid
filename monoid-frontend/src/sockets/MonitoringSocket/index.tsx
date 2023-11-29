import { faFire } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion } from 'framer-motion';
import { FC } from 'react';

const MonitoringSocket: FC = () => (
  <AnimatePresence>
    <motion.div
      className="flex justify-center text-center"
      initial={{ opacity: 0, marginLeft: 32 }}
      animate={{ opacity: 1, marginLeft: 0 }}
      exit={{ opacity: 0, marginLeft: '-100vw' }}
    >
      <div>
        <div className=" border-monoid-700 p-8 inline-block">
          <FontAwesomeIcon
            icon={faFire}
            className="text-5xl text-monoid-700 fa-fw"
            bounce
          />
        </div>
        <div>Coming soon!</div>
      </div>
    </motion.div>
  </AnimatePresence>
);

export default MonitoringSocket;
