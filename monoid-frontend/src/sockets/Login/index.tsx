import { FC, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';

import monoidGhost from 'src/assets/monoid-ghost.svg';
import monoidText from 'src/assets/monoid-text.svg';
import Button from 'src/components/0100_button';
import { useMutation } from 'react-query';
import authWithGoogle from 'src/mutations/authWithGoogle';

interface IAuthResponse {
  success: boolean;
}
interface IAuthResponseSuccess extends IAuthResponse {
  success: true;
  session_token: string;
  first_name?: string;
  last_name?: string;
  email: string;
  subdomain: string;
}

export type TSuccessfulAuth = Omit<IAuthResponseSuccess, 'success' | 'error'>;

interface IAuthResponseFailure extends IAuthResponse {
  success: false;
  error: string;
}

interface IAuthRequestVariables {
  code: string;
}

interface IProps {
  onLogin: ( params: TSuccessfulAuth ) => void;
  onFailedLogin: ( error: string ) => void;
}

const Login: FC<IProps> = ({ onLogin, onFailedLogin }) => {
  const year = new Date().getFullYear();
  const { data: authGoogleData, mutate: authGoogle } = useMutation<
    IAuthResponseSuccess | IAuthResponseFailure,
    unknown,
    IAuthRequestVariables
  >( authWithGoogle );

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async ({ code }) => {
      authGoogle({ code });
    },
    onError: () => onFailedLogin( 'Unable to Authenticate with Google' ),
    flow: 'auth-code',
  });

  useEffect(() => {
    if ( authGoogleData ) {
      if ( authGoogleData.success ) {
        onLogin( authGoogleData );
      } else {
        onFailedLogin( authGoogleData?.error ?? 'Unknown Error' );
      }
    }
  }, [ authGoogleData, onFailedLogin, onLogin ]);

  return (
    <div className="h-screen w-screen">
      <div className="h-[calc(100%-72px)]">
        <div className="h-full w-full flex flex-wrap items-center content-center justify-center lg:w-2/5 xl:w-1/3">
          <div className="flex justify-start w-full max-w-[320px] sm:max-w-[372px] mb-4">
            <img src={monoidGhost} alt="M" className="pr-4 h-[48px]" />
            <img src={monoidText} alt="onoid" className="h-[48px]" />
          </div>
          <div className="w-full" />
          <div className="w-full max-w-[320px] sm:max-w-[372px] text-xl mb-4">
            Log in to get started
          </div>
          <div className="w-full" />
          <div className="w-full max-w-[320px] sm:max-w-[372px]">
            <Button className="w-full mb-4" onClick={loginWithGoogle}>
              <FontAwesomeIcon icon={faGoogle} className="pr-2" />
              Continue with Google
            </Button>
            <div className="text-xs">
              By signing up, you agree to our Terms of Service & Privacy Policy
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-start items-center pl-4 h-[72px]">
        <div className="flex justify-start items-center">
          <Button className="mr-4 flex flex-nowrap items-center">
            <FontAwesomeIcon icon={faGlobe} className="pr-2" />
            <div>EN</div>
          </Button>
          <div className="text-sm">
            © {year} Monoid, Inc. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
