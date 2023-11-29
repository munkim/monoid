import { FC } from 'react';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartColumn,
  faCode,
} from '@fortawesome/free-solid-svg-icons';
import {
  faMessage,
  faSun
} from '@fortawesome/free-regular-svg-icons';
import Sidebar from '../0100_sidebar';
import Card from '../0200_card';

const AgentSidebar: FC = () => {
  const { pathname } = useLocation();
  const lastSegment = pathname.split( '/' )[3];

  return (
    <Sidebar>
      <Card
        className="text-left border-0 h-auto"
        rounded={false}
        variant={
          !lastSegment || lastSegment === 'config' || lastSegment === 'actions'
            ? 'softLight'
            : 'link'
        }
        to="config"
      >
        <div className="flex items-center">
          <FontAwesomeIcon 
            icon={faSun}
            className="text-l mr-2 py-1 fa-fw"
          />
          <span className="hidden md:block whitespace-nowrap overflow-hidden">
            Configuration
          </span>
        </div>
      </Card>
      <Card
        className="text-left border-0 h-auto"
        rounded={false}
        variant={lastSegment === 'api_access' ? 'softLight' : 'link'}
        to="api_access"
      >
        <div className="flex items-center">
          <FontAwesomeIcon
            icon={faCode}
            className="text-l mr-2 py-1 fa-fw"
          />
          <span className="hidden md:block whitespace-nowrap overflow-hidden">
            API
          </span>
        </div>
      </Card>
      <Card
        className="text-left border-0 h-auto"
        rounded={false}
        variant={lastSegment === 'monitoring' ? 'softLight' : 'link'}
        to="monitoring"
      >
        <div className="flex items-center">
          <FontAwesomeIcon
            icon={faChartColumn}
            className="text-l mr-2 py-1 fa-fw"
          />
          <span className="hidden md:block whitespace-nowrap overflow-hidden">
            Monitoring
          </span>
        </div>
      </Card>
      <Card
        className="text-left border-0 h-auto"
        rounded={false}
        variant={lastSegment === 'conversation_manager' ? 'softLight' : 'link'}
        to="conversation_manager"
      >
        <div className="flex items-center">
          <FontAwesomeIcon
            icon={faMessage}
            className="text-l mr-2 py-1 fa-fw"
          />
          <span className="hidden md:block whitespace-nowrap overflow-hidden">
            Conversation Manager
          </span>
        </div>
      </Card>
    </Sidebar>
  );
};

export default AgentSidebar;
