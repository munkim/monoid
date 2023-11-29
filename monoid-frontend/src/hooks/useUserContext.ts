import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalstorageState } from 'rooks';
import UserContext, { TModal } from 'src/contexts/User';
import { TSuccessfulAuth } from 'src/sockets/Login';

const useUserContext = () => {
  const navigate = useNavigate();
  const [ isAppReady, setIsAppReady ] = useState( false );
  const { user, setUser } = useContext( UserContext );
  const [ lsUser, setLsUser ] = useLocalstorageState<TSuccessfulAuth>(
    'currentUser',
    {
      session_token: '',
      first_name: '',
      last_name: '',
      email: '',
      subdomain: '',
    },
  );
  const setActiveModal = useCallback(
    ({ title, type, children }: TModal ) => {
      setUser( x => ({
        ...x,
        activeModal: { title, type, children },
      }));
    },
    [ setUser ],
  );
  const clearActiveModal = useCallback(() => {
    setUser( x => ({
      ...x,
      activeModal: null,
    }));
  }, [ setUser ]);

  const handleLogin = useCallback(
    ( response: TSuccessfulAuth ) => {
      setLsUser( response );
      setUser( x => ({
        ...x,
        sessionToken: response.session_token,
        firstName: response.first_name || '',
        lastName: response.last_name || '',
        email: response.email,
        subdomain: response.subdomain,
        activeModal: {
          title: 'Login Successful',
          type: 'success',
          children: 'You have successfully logged in.',
        },
      }));
    },
    [ setLsUser, setUser ],
  );

  const handleFailedLogin = useCallback(
    ( error: string ) =>
      setUser( x => ({
        ...x,
        activeModal: { title: 'Auth Error', type: 'error', children: error },
      })),
    [ setUser ],
  );

  const handleLogout = useCallback(() => {
    setLsUser({
      session_token: '',
      first_name: '',
      last_name: '',
      email: '',
      subdomain: '',
    });
  }, [ setLsUser ]);

  useEffect(() => {
    if ( lsUser.session_token?.trim()?.length > 0 ) {
      setIsAppReady( true );
      setUser( x => ({
        ...x,
        sessionToken: lsUser.session_token,
        firstName: lsUser.first_name || '',
        lastName: lsUser.last_name || '',
        email: lsUser.email,
        subdomain: lsUser.subdomain,
      }));
    } else {
      setIsAppReady( false );
    }
  }, [ lsUser, setUser ]);

  useEffect(() => {
    if ( !lsUser.session_token ) {
      navigate( '/' );
    }
  }, [ lsUser, navigate ]);

  return {
    clearActiveModal,
    handleFailedLogin,
    handleLogin,
    handleLogout,
    hasTokenInLs: lsUser.session_token?.trim()?.length > 0,
    isAppReady,
    setActiveModal,
    user,
  };
};

export default useUserContext;
