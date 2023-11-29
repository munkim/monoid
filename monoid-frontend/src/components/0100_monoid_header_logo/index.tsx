import { FC } from 'react';
import { Link } from 'react-router-dom';
import monoidGhost from 'src/assets/monoid-ghost.svg';
import monoidText from 'src/assets/logo-with-text.svg';

const MonoidHeaderLogo: FC = () => (
  <Link to="/" className="flex shrink-0">
    <img
      src={monoidText}
      alt="Monoid"
      className="h-[24px] min-w-[164px] pr-8 hidden md:block"
    />
    <img
      src={monoidGhost}
      alt="logo"
      className="h-[24px] pr-4 block md:hidden"
    />
  </Link>
);

export default MonoidHeaderLogo;
