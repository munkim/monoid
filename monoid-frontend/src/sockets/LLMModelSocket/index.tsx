import { FC, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import updateAgent, { TPayload } from 'src/mutations/updateAgent';
import { TProjectUpdateResponse } from 'src/types/project';
import Input from 'src/components/0100_input';
import Card from 'src/components/0200_card';

interface IProps {
  isSelected?: boolean;
  imgSrc: string;
  label: string;
  isEditable: boolean;
  llmApiKey?: string;
  disabled?: boolean;
  onClick?: () => void;
}

const LLMModelSocket: FC<IProps> = ({
  isSelected,
  imgSrc,
  label,
  isEditable,
  llmApiKey,
  disabled,
  onClick
}) => {

  const { register, watch, reset } = useForm({
    defaultValues: {
      value: llmApiKey,
    },
  });

  const { id } = useParams();
  const queryClient = useQueryClient();
  const { mutate: update } = useMutation<
    TProjectUpdateResponse,
    unknown,
    TPayload
  >( updateAgent, {
    onSuccess() {
      queryClient.invalidateQueries([ 'agent', id ]);
    },
  });
  
  useEffect(() => {
    reset({ value: llmApiKey || '' }); // Set the initial value when 'notes' changes
  }, [llmApiKey]);

  const [ isSecure, setIsSecure ] = useState( true );

  return (
    <Card
    disabled={disabled}
    className="h-auto mt-2 text-left font-bold"
    variant={isSelected && !disabled ? 'whiteWithBorder' : 'white'}
    onClick={!disabled ? onClick : undefined}
    >
        <div className="flex items-center">
          <img 
            src={imgSrc}
            alt="OpenAI" 
            className="h-6 mr-2"
            style={disabled ? {opacity: 0.25}: {}}
          />
          {label}
        </div>
        {isEditable && isSelected && !disabled && (
          <div className="pl-8 font-normal italic text-monoid-700 text-sm">
            API Key
            <Input
              type={isSecure ? 'password' : 'text'}
              className="py-1 font-mono w-full"
              onFocus={() => setIsSecure( false )}
              {...register( 'value' )}
              onBlur={() => {
                setIsSecure( true );
                update({ agentId: Number(id), llmApiKey: watch('value') });
              }}
            />
          </div>
        )}
      </Card>
  );
};

export default LLMModelSocket;
