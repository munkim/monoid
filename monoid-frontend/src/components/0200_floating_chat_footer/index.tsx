import { FC, useCallback, useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { useParams } from 'react-router-dom';
import clsx from 'clsx';
import Input from '../0100_input';

interface IProps {
  onSend: () => void;
}

const FloatingChatFooter: FC<IProps> = ({ onSend }) => {
  const { sessionId } = useParams();
  const { register, setFocus, watch } = useFormContext();
  const ref = useRef<HTMLDivElement>( null );

  const fixPosition = useCallback(() => {
    let height = window.visualViewport?.height || 0;
    const viewport = window.visualViewport;
    const isIDevice = /iphone|ipad|ipod/.test(
      navigator.userAgent.toLowerCase(),
    );

    if ( ref.current ) {
      if ( !isIDevice ) {
        height = viewport?.height || 0;
      }

      ref.current.style.bottom = `${height - ( viewport?.height || 0 )}px`;
    }
  }, []);

  const handleScroll = useCallback(() => {
    if ( ref.current ) {
      ref.current.style.bottom = '16px';
    }
  }, []);

  useEffect(() => {
    setFocus( 'message' );
  }, [ setFocus, sessionId ]);

  useEffect(() => {
    window.addEventListener( 'resize', fixPosition );
    window.addEventListener( 'scroll', handleScroll );
    fixPosition();

    return () => {
      window.removeEventListener( 'resize', fixPosition );
      window.removeEventListener( 'scroll', handleScroll );
    };
  }, [ fixPosition, handleScroll ]);

  return (
    <div
      ref={ref}
      className="fixed w-[calc(100%-20px)] md:w-[calc(75%-34px)] bg-monoid-100"
    >
      <Input
        placeholder="Say something..."
        className={clsx( 'w-full mb-2 md:mb-4' )}
        icon={{
          type: watch( 'message' ).trim().length > 0 ? faPaperPlane : undefined,
        }}
        onIconClick={onSend}
        onKeyDown={e => {
          if ( e.key === 'Enter' ) {
            onSend();
          }
        }}
        {...register( 'message' )}
      />
    </div>
  );
};

export default FloatingChatFooter;
