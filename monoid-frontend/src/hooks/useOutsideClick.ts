import { useEffect } from 'react';

const useOutsideClick = ( ref: any, excludedElements: any, callback: any ) => {
  const handleClick = ( e: any ) => {
    if (
      ref.current &&
      !ref.current.contains( e.target ) &&
      !excludedElements?.some(( element: any ) => element.contains( e.target ))
    ) {
      callback();
    }
  };

  useEffect(() => {
    document.addEventListener( 'click', handleClick );

    return () => {
      document.removeEventListener( 'click', handleClick );
    };
  });
};

export default useOutsideClick;
