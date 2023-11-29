import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { forwardRef, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import Logo from 'src/assets/logo.svg';
import LogoWithText from 'src/assets/logo-with-text.svg';
import useOutsideClick from 'src/hooks/useOutsideClick';
import clsx from 'clsx';
import AccountSocket from 'src/sockets/AccountSocket';

type TAgentInfo = {
  agentId: number;
  slug: string;
  subdomain: string;
  name: string;
};

type TChatSession = {
  chatSessionUuid: string;
  title: string;
  updatedAt: string;
};

const ChatHeader = forwardRef<
  HTMLDivElement,
  {
    menuOpen: boolean;
    agentInfo?: TAgentInfo;
    setMenuOpen: ( isShowing: boolean ) => void;
    chatSessions: TChatSession[];
  }
>(( props, ref: any ) => {
  const [ isShowing, setIsShowing ] = useState( true );
  const [ title, setTitle ] = useState( '' );
  const { sessionId } = useParams();

  const handleClick = () => {
    setIsShowing( prev => !prev );
    props.setMenuOpen( isShowing );
  };

  useOutsideClick( ref, [], () => {
    if ( props.menuOpen ) {
      setIsShowing( prev => !prev );
    }
  });

  useEffect(() => {
    const caption = props.chatSessions
      ?.find( item => item.chatSessionUuid === sessionId )
      ?.title.toString();
    setTitle( caption ?? '' );
  }, [ props.chatSessions, sessionId ]);

  return (
    <header
      className="z-50 flex items-center border-b border-b-monoid-300 bg-monoid-100 p-1 px-2 md:p-2 md:px-8"
      ref={ref}
    >
      <div className="items-center justify-center hidden lg:block lg:flex-none w-[260px] lg:mr-[30px]">
        <Link to="/">
          <img src={LogoWithText} alt="logo" className="h-[24px]" />
        </Link>
      </div>
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center justify-center lg:hidden"
      >
        <FontAwesomeIcon icon={faBars} className="cursor-pointer h-[22px]" />
      </button>
      <Link to="/">
        <img
          src={Logo}
          alt="logo"
          className="block m-auto ml-10 py-[15px] lg:hidden"
        />
      </Link>
      <div className="flex items-center justify-between w-full">
        <div className="ml-[10px] font-bold text-monoid-900 text-[17px] lg:text-[20px] leading-[28px] flex items-center line-clamp-1">
          <span
            className={clsx(
              'line-clamp-1',
              sessionId && sessionId !== 'new' && 'opacity-50',
            )}
          >
            {props.agentInfo && (
              <Link to={`/agents/${props.agentInfo.agentId}`}>
                {props.agentInfo.name}
              </Link>
            )}
          </span>
          {sessionId && sessionId !== 'new' && title && (
            <span className="ml-1 line-clamp-1">{` / ${title}`}</span>
          )}
        </div>
        <AccountSocket />
      </div>
    </header>
  );
});

export default ChatHeader;
