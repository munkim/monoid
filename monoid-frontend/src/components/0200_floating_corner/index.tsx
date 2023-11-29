import { FC } from 'react';
import useUserContext from 'src/hooks/useUserContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRightFromBracket,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import Button from '../0100_button';

const FloatingCorner: FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { handleLogout, hasTokenInLs } = useUserContext();

  if ( !hasTokenInLs ) return null;

  return (
    <div className="fixed top-4 right-4 md:top-8 md:right-8">
      <div className="flex items-center">
        {pathname.match( /action_hub/ ) && (
          <Button
            variant="invert"
            className="mr-2"
            onClick={() => navigate( `/actions/new?redirect=${pathname}` )}
          >
            <FontAwesomeIcon icon={faPlus} className="text-lg" />
            <div className="hidden sm:inline-flex sm:ml-2">
              Create New Action
            </div>
          </Button>
        )}
        {( pathname.match( /agents$/ ) || pathname === '/' ) && (
          <Button
            variant="invert"
            className="mr-2"
            onClick={() => navigate( '/agents/new' )}
          >
            <FontAwesomeIcon icon={faPlus} className="text-lg" />
            <div className="hidden sm:inline-flex sm:ml-2">
              Create New Agent
            </div>
          </Button>
        )}
        <Button onClick={handleLogout}>
          <FontAwesomeIcon icon={faArrowRightFromBracket} />
        </Button>
      </div>
    </div>
  );
};

export default FloatingCorner;
