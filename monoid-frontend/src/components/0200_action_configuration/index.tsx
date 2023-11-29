import { FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Input from '../0100_input';

interface IProps {
  parameterKey: string;
  description: string;
  dataType: string;
  configuredValue: string | number | boolean;
  onChange: ( value: string | number | boolean ) => void;
}

const ActionConfiguration: FC<IProps> = ({
  parameterKey,
  description,
  configuredValue,
  onChange,
}) => {
  const { getValues, register, reset } = useForm({
    defaultValues: {
      value: '' as string | number | boolean,
    },
  });

  useEffect(() => {
    reset({ value: configuredValue });
  }, [ configuredValue, reset ]);

  return (
    <div className="border-y mt-2 py-2 border-l-4 pl-4 border-monoid-300 hover:border-l-monoid-700 focus-within:border-l-monoid-700">
      <div className="grid grid-cols-1 md:grid-cols-2 items-center mb-2">
        <div className="text-left mb-2 md:mb-0">
          <span className="rounded bg-monoid-300 font-mono px-2 py-1">
            {parameterKey}
          </span>
        </div>
        <Input
          className="w-full"
          {...register( 'value' )}
          onBlur={() => onChange( getValues( 'value' ))}
        />
      </div>
      <div className="text-left">{description}</div>
    </div>
  );
};

export default ActionConfiguration;
