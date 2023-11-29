import {
  faArrowTurnUp,
  faMinimize,
  faPencil,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FC, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Toggle from 'react-toggle';
import Button from 'src/components/0100_button';
import InlineSelect from 'src/components/0100_inline_select';
import Input from 'src/components/0100_input';
import Card from 'src/components/0200_card';
import Dropdown from 'src/components/0100_dropdown';

type TArgumentProvider = 'creator' | 'agent' | 'user';
type TDataType = 'string' | 'number' | 'boolean';
type TPlacement = 'header' | 'query_parameter' | 'path_parameter' | 'body';

export type TParameter = {
  parameterKey: string;
  argumentProvider: TArgumentProvider;
  dataType: TDataType;
  description: string;
  isRequired: boolean;
  overridingArgument?: string;
  placement: TPlacement;
};

interface IProps {
  id?: number;
  parameter: Partial<TParameter>;
  onChange: ({ id, val }: { id: number; val: TParameter }) => void;
  onDelete?: ({ id }: { id: number }) => void;
}

const ActionParameter: FC<IProps> = ({ id, parameter, onChange, onDelete }) => {
  const [ isCompact, setIsCompact ] = useState( true );
  const {
    register,
    reset,
    setValue,
    watch,
    formState: { isValid },
  } = useForm({
    defaultValues: {
      parameterKey: '',
      argumentProvider: 'user' as TArgumentProvider,
      dataType: 'string' as TDataType,
      description: '',
      isRequired: false,
      overridingArgument: '',
      placement: 'header' as TPlacement,
    },
  });

  const handleParameterChange = useCallback(() => {
    const { argumentProvider } = watch();
    const values = {
      ...watch(),
      overridingArgument:
        argumentProvider !== 'creator' ? undefined : argumentProvider,
    };

    onChange({ id: id || Number( new Date()), val: values });
  }, [ watch, onChange, id ]);

  useEffect(() => {
    if ( parameter.parameterKey ) {
      reset( parameter );
    }
  }, [ parameter, reset ]);

  return (
    <div className="border-l-4 pl-4 border-monoid-300 hover:border-monoid-700 focus-within:border-monoid-700">
      {isCompact ? (
        <div>
          {parameter.parameterKey ? (
            <button
              type="button"
              className="p-2 my-2 border border-monoid-700 rounded bg-white text-sm w-full text-left relative"
              onClick={() => setIsCompact( false )}
            >
              <div className="absolute right-4 top-4">
                <FontAwesomeIcon icon={faPencil} className="text-xl" />
              </div>
              <div>
                <span className="underline font-semibold">
                  {watch( 'parameterKey' )}
                </span>
                <span>{watch( 'isRequired' ) && ' *'}</span>
              </div>
              <div className="my-2 font-semibold">{watch( 'description' )}</div>
              <div>
                Configured by{' '}
                <span className="font-semibold">{`${watch(
                  'argumentProvider',
                )}`}</span>
              </div>
            </button>
          ) : (
            <Card className="mt-4 h-auto" onClick={() => setIsCompact( false )}>
              <div className="font-bold text-3xl -mt-1">+</div>
            </Card>
          )}
        </div>
      ) : (
        <div className="relative">
          <button
            type="button"
            className="absolute right-0"
            onClick={() => setIsCompact( true )}
          >
            <FontAwesomeIcon icon={faMinimize} />
          </button>
          <div className="font-bold mt-4">Key *</div>
          <Input
            className="w-full"
            {...register( 'parameterKey', { required: true })}
            defaultValue={watch( 'parameterKey' )}
          />
          <div className="mt-4 flex items-center justify-between">
            <div className="font-bold mb-2">Required?</div>
            <div>
              <Toggle
                defaultChecked={watch( 'isRequired' )}
                {...register( 'isRequired' )}
                onChange={x => {
                  setValue( 'isRequired', x.target.checked );
                }}
              />
            </div>
          </div>
          <div className="font-bold mt-4">Placement</div>
          <InlineSelect
            className="px-2 text-sm"
            selectedOption={watch( 'placement' )}
            options={[
              { value: 'header' },
              { value: 'path_parameter', label: 'Path Param' },
              { value: 'query_parameter', label: 'Query Param' },
              { value: 'body' },
            ]}
            onChange={val => setValue( 'placement', val as TPlacement )}
          />
          <div className="font-bold mt-4">Type *</div>
          <Dropdown
            selectedOption={watch( 'dataType' )}
            options={[
              { value: 'string' },
              { value: 'number' },
              { value: 'boolean' },
            ]}
            onChange={val => setValue( 'dataType', val as TDataType )}
          />
          <div className="font-bold mt-4">Provider *</div>
          <Dropdown
            selectedOption={watch( 'argumentProvider' )}
            options={[
              { value: 'agent' },
              { value: 'creator' },
              { value: 'user' },
            ]}
            onChange={val =>
              setValue( 'argumentProvider', val as TArgumentProvider )
            }
          />
          {watch( 'argumentProvider' ) === 'creator' && (
            <div className="flex items-center">
              <div className="px-4">
                <FontAwesomeIcon icon={faArrowTurnUp} className="rotate-90" />
              </div>
              <div>
                <div className="font-bold mt-4">Value</div>
                <Input
                  className="w-full"
                  {...register( 'overridingArgument', { required: true })}
                  defaultValue={watch( 'overridingArgument' )}
                />
              </div>
            </div>
          )}
          <div className="font-bold mt-4">Short Decription *</div>
          <Input
            className="w-full"
            {...register( 'description', { required: true })}
          />
          {parameter.parameterKey ? (
            <div className="flex items-center">
              <Button
                variant="invert"
                className="mt-4 px-8 mr-2"
                onClick={() => {
                  onDelete?.({ id: Number( id ) });
                }}
              >
                <FontAwesomeIcon icon={faTrash} />
              </Button>
              <Button
                disabled={!isValid}
                variant="invert"
                className="w-full mt-4"
                onClick={() => {
                  if ( isValid ) {
                    handleParameterChange();
                    reset({});
                    setIsCompact( true );
                  }
                }}
              >
                Update Parameter
              </Button>
            </div>
          ) : (
            <Button
              disabled={!isValid}
              variant="invert"
              className="w-full mt-4"
              onClick={() => {
                if ( isValid ) {
                  handleParameterChange();
                  reset({});
                  setIsCompact( true );
                }
              }}
            >
              Create Parameter
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionParameter;
