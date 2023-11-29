const getRequestHeader = () => {
  const currentUser = JSON.parse(
    window.localStorage.getItem( 'currentUser' ) || '{}',
  );

  return {
    'x-session-token': currentUser.session_token || '',
  };
};

export default getRequestHeader;
