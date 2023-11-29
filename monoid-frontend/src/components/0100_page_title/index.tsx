import clsx from 'clsx';
import { FC, useState } from 'react';
import {
  Link,
  useLocation,
  useMatch,
  useNavigate,
  useParams,
} from 'react-router-dom';
import monoidGhost from 'src/assets/monoid-ghost.svg';
import monoidText from 'src/assets/monoid-text.svg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faGear } from '@fortawesome/free-solid-svg-icons';
import InlineSelect from '../0100_inline_select';

interface IProps {
  isVectorLogo?: boolean;
  showNavigation?: boolean;
  title: string;
}

const PageTitle: FC<IProps> = ({
  isVectorLogo,
  showNavigation = true,
  title,
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const routeMatchWithSection = useMatch( '/agents/:id/:section' );
  const { pathname } = useLocation();
  const [ isNavigationExpanded, setIsNavigationExpanded ] = useState( false );
  const routeMatch = useMatch( 'agents/:id' );
  const routeProjectSection = routeMatchWithSection?.params.section;
  const isPersisted = Number( id || 0 ) > 0;

  return (
    <div>
      <div className="relative">
        <div className="flex">
          <button
            type="button"
            className="flex shrink-0"
            onClick={() => setIsNavigationExpanded( x => !x )}
          >
            <img src={monoidGhost} alt="logo" className="h-[36px] pr-4" />
          </button>
          <div className="flex items-center">
            <div className="font-bold text-xl md:text-3xl mr-2 max-w-[calc(100vw-144px)] md:max-w-[calc(100vw-312px)] whitespace-nowrap overflow-hidden">
              {isVectorLogo ? (
                <img src={monoidText} alt={title} className="h-[36px]" />
              ) : (
                title
              )}
            </div>
            <div className="hidden md:block">
              {isPersisted && showNavigation && (
                <InlineSelect
                  selectedOption={
                    routeMatchWithSection?.params.section === 'config'
                      ? 'config'
                      : 'basic'
                  }
                  options={[
                    {
                      value: 'basic',
                      label: <FontAwesomeIcon icon={faEdit} className="px-4" />,
                    },
                    {
                      value: 'config',
                      label: <FontAwesomeIcon icon={faGear} className="px-4" />,
                    },
                  ]}
                  onChange={x =>
                    navigate( `/agents/${id}${x === 'config' ? '/config' : ''}` )
                  }
                />
              )}
            </div>
          </div>
        </div>
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
      </div>
      {showNavigation && isPersisted && (
        <div className="md:hidden mt-4 grid grid-cols-2 rounded border border-monoid-300 border-collapse">
          <Link
            to={`/agents/${id}`}
            className={clsx(
              'text-center items-center px-4 py-2 border-r border-monoid-300',
              {
                'bg-monoid-900 text-monoid-100': !routeProjectSection,
              },
            )}
          >
            Basics
          </Link>
          <Link
            to={`/agents/${routeMatch?.params.id}/config`}
            className={clsx(
              'text-center items-center px-4 py-2 border-monoid-300',
              {
                'bg-monoid-900 text-monoid-100':
                  routeProjectSection === 'config',
              },
            )}
          >
            Configuration
          </Link>
        </div>
      )}
    </div>
  );
};

export default PageTitle;
