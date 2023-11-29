import { FC, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { useIntervalWhen } from 'rooks';
import Button from 'src/components/0100_button';
import Input from 'src/components/0100_input';
import addEmailToAllowlist, {
  TAddEmailToAllowlistPayload,
  TAddEmailToAllowlistResponse,
} from 'src/mutations/addEmailToAllowlist';

const EmailAllowlist: FC = () => {
  const {
    register,
    setFocus,
    setValue,
    trigger,
    watch,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: {
      email: '',
    },
  });

  const { email } = watch();
  const [ successMessage, setSuccessMessage ] = useState<string | null>( null );
  const [ errorMessage, setErrorMessage ] = useState<string | null>( null );
  const { isLoading, mutate } = useMutation<
    TAddEmailToAllowlistResponse,
    unknown,
    TAddEmailToAllowlistPayload
  >( addEmailToAllowlist, {
    onSuccess( data ) {
      if ( data.status ) {
        setSuccessMessage( data.message );
        setValue( 'email', '' );
        setFocus( 'email' );
      } else {
        setErrorMessage( data.message );
        setFocus( 'email' );
      }
    },
  });
  const handleSubmit = useCallback(() => {
    setErrorMessage( null );
    mutate({ email });
  }, [ email, mutate ]);

  useIntervalWhen(() => setSuccessMessage( null ), 2000, !!successMessage );

  useEffect(() => {
    setFocus( 'email' );
  }, [ setFocus ]);

  return (
    <div>
      Add email to allowlist
      <div className="flex gap-2 justify-start mt-2">
        <div>
          <Input
            placeholder="me@example.com"
            {...register( 'email', {
              required: true,
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: 'Entered value does not match email format',
              },
            })}
            onKeyUp={() => trigger( 'email' )}
            onKeyDown={e => {
              if ( e.code === 'Enter' ) {
                handleSubmit();
              }
            }}
          />
        </div>
        <div>
          <Button
            variant="invert"
            disabled={!isValid || isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? 'Adding...' : 'Add'}
          </Button>
        </div>
      </div>
      <div className="mt-2">
        {errors && <div className="text-red-500">{errors.email?.message}</div>}
        {successMessage && (
          <div className="text-monoid-green-500">{successMessage}</div>
        )}
        {errorMessage && <div className="text-red-500">{errorMessage}</div>}
      </div>
    </div>
  );
};

export default EmailAllowlist;
