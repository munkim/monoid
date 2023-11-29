import {
  faCheck,
  faTicket,
  faUser,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from 'react-query';
import { useIntervalWhen } from 'rooks';
import Button from 'src/components/0100_button';
import FullScreenModal from 'src/components/0100_full_screen_modal';
import Input from 'src/components/0100_input';
import useUserContext from 'src/hooks/useUserContext';
import updateAccount, {
  TUpdateAccountPayload,
  TUpdateAccountResponse,
} from 'src/mutations/updateAccount';
import getCurrentAccount from 'src/queries/getCurrentAccount';

type TAccountResponse = {
  firstName: string;
  lastName: string;
  email: string;
};

const AccountSocket: FC = () => {
  const { handleLogout } = useUserContext();
  const [ isOpen, setIsOpen ] = useState( false );
  const [ isUpdated, setIsUpdated ] = useState( false );
  const { data } = useQuery<unknown, unknown, TAccountResponse>({
    queryKey: [ 'account' ],
    queryFn: () => getCurrentAccount(),
  });

  const {
    register,
    reset,
    watch,
    formState: { isDirty },
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      language: '🌐 English',
    },
  });

  const { firstName, lastName, email, language } = watch();

  const { mutate, isLoading } = useMutation<
    TUpdateAccountResponse,
    unknown,
    TUpdateAccountPayload
  >( updateAccount, {
    onSuccess( data ) {
      reset({
        ...data,
        email,
        language,
      });

      setIsUpdated( true );
    },
  });

  const handleUpdate = useCallback(() => {
    setIsUpdated( false );
    mutate({ firstName, lastName });
  }, [ firstName, lastName, mutate ]);

  useEffect(() => {
    reset({ ...data, language: '🌐 English' });
  }, [ data, reset ]);

  useEffect(() => {
    if ( isDirty ) {
      setIsUpdated( false );
    }
  }, [ isDirty ]);

  useIntervalWhen(() => setIsUpdated( false ), 2000, isUpdated );

  return (
    <>
      <Button onClick={() => setIsOpen( true )}>
        <FontAwesomeIcon icon={faUser} />
      </Button>
      <FullScreenModal isOpen={isOpen} onClose={() => setIsOpen( false )}>
        <div className="p-4">
          <div className="text-xl font-bold">Settings</div>
          <div className="flex md:grid md:grid-cols-12 gap-4 max-w-[640px]">
            <div className="col-span-4">
              <div className="grid grid-cols-1 gap-1 mt-4">
                <Button
                  variant="white"
                  className="col-span-1 w-full text-center md:text-left font-semibold"
                >
                  <FontAwesomeIcon icon={faUser} className="fa-fw" />
                  <span className="hidden md:inline-block pl-2">Account</span>
                </Button>
                <Button
                  disabled
                  variant="white"
                  className="w-full text-center md:text-left"
                >
                  <FontAwesomeIcon icon={faUsers} className="fa-fw" />
                  <span className="hidden md:inline-block pl-2">Team</span>
                </Button>
                <Button
                  disabled
                  variant="white"
                  className="w-full text-center md:text-left"
                >
                  <FontAwesomeIcon icon={faTicket} className="fa-fw" />
                  <span className="hidden md:inline-block pl-2">
                    Subscription
                  </span>
                </Button>
                <button
                  type="button"
                  className="border-0 text-sm hover:underline text-left mt-2 px-2"
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
              </div>
            </div>
            <div className="col-span-8 max-w-[50vw] md:max-w-none">
              <div className="grid grid-cols-1 md:grid-cols-2 items-center mt-4 gap-2 md:gap-4 ">
                <div>First Name</div>
                <Input className="w-full" {...register( 'firstName' )} />
                <div>Last Name</div>
                <Input className="w-full" {...register( 'lastName' )} />
                <div>Email</div>
                <Input className="w-full" disabled {...register( 'email' )} />
                <div>Language</div>
                <Input className="w-full" disabled {...register( 'language' )} />
              </div>
              <div className="flex justify-end items-center mt-4 gap-4">
                <AnimatePresence>
                  {isUpdated && (
                    <motion.div
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-monoid-green-500"
                    >
                      <FontAwesomeIcon icon={faCheck} className="mr-2" />
                      Updated
                    </motion.div>
                  )}
                </AnimatePresence>
                <Button
                  disabled={isLoading || !isDirty}
                  variant="invert"
                  onClick={handleUpdate}
                >
                  {isLoading ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </div>
          </div>
          <div className="text-right mt-4" />
        </div>
      </FullScreenModal>
    </>
  );
};

export default AccountSocket;
