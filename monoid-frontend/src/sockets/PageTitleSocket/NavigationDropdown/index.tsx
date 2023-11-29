import { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

interface IProps {
  isNavigationExpanded: boolean;
}

const NavigationDropdown: FC<IProps> = ({ isNavigationExpanded }) => {
  const { pathname } = useLocation();

  return (
    <div className="absolute mt-4 z-10">
      <div
        className={clsx(
          'min-w-[160px] bg-monoid-100 drop-shadow-lg overflow-auto transition-all duration-300',
          isNavigationExpanded ? 'border max-h-[50vh]' : 'border-0 max-h-0',
        )}
      >
        <Link to="/action_hub">
          <div
            className={clsx(
              'border-l-4 border-monoid-300 px-4 py-2 hover:border-monoid-700',
              [ '/action_hub' ].includes( pathname ) && 'border-monoid-700',
            )}
          >
            Action Hub
          </div>
        </Link>
        <Link to="/">
          <div
            className={clsx(
              'border-l-4 border-monoid-300 px-4 py-2 hover:border-monoid-700',
              [ '/', '/agents' ].includes( pathname ) && 'border-monoid-700',
            )}
          >
            Agents
          </div>
        </Link>
      </div>
    </div>
  );
};

export default NavigationDropdown;
