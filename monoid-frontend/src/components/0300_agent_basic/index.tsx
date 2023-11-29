import { FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
// import Toggle from 'react-toggle';
import ScaleLoader from 'react-spinners/ScaleLoader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import Toggle from 'react-toggle';
import CategoriesMultiDropdown from 'src/sockets/CategoriesMultiDropdown';
import { snakeCase } from 'lodash';
import TextArea from '../0100_textarea';
import Input from '../0100_input';
import LayoutOneColumnCentered from '../0100_layout_one_column_centered';
import Button from '../0100_button';

export type TProjectBasic = {
  agentId?: number;
  name: string;
  description: string;
  instructions: string | null;
  categories: {
    categoryId: number;
  }[];
  slug: string;
  url: string;
  agentType: string;
  isEditable: boolean;
  isPublic: boolean;
  llmOption: string;
  llmApiKey: string;
};

interface IProps {
  data?: TProjectBasic;
  isCreating: boolean;
  isPersisted?: boolean;
  isUpdating?: boolean;
  subdomain: string;
  onCreate: (
    payload: Omit<TProjectBasic, 'categories' | 'isEditable' | 'llmOption' | 'llmApiKey'> & {
      subdomain: string;
    },
  ) => void;
  onUpdate: (
    payload: Partial<
      Omit<TProjectBasic, 'categories'> & { categoryIds?: number[] }
    >,
  ) => void;
}

const AgentBasic: FC<IProps> = ({
  data,
  isCreating,
  isPersisted,
  isUpdating,
  subdomain,
  onCreate,
  onUpdate,
}) => {
  const {
    register,
    getValues,
    reset,
    setFocus,
    setValue,
    watch,
    formState: { isValid },
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      instructions: '',
      slug: '',
      url: '',
      agentType: 'ReAct Agent',
      isPublic: true,
      categoryIds: [] as number[],
    },
    mode: 'onTouched',
  });

  const { name, description, instructions, slug, categoryIds } = watch();
  const url = `${subdomain}.monoid.so/${slug}`;

  useEffect(() => {
    reset({
      ...data,
      instructions: data?.instructions || '',
      categoryIds: data?.categories.map( x => x.categoryId ) || [],
    });
  }, [ data, reset ]);

  useEffect(() => {
    if ( !isPersisted ) {
      setTimeout(() => setFocus( 'name' ), 200 );
    }
  }, [ isPersisted, setFocus ]);

  return (
    <LayoutOneColumnCentered>
      <div>
        <div className="mt-8">
          <div className="font-bold mb-2">
            What is the name of your Agent? *
          </div>
          <Input
            className="w-full"
            defaultValue={getValues( 'name' )}
            disabled={data && !data.isEditable}
            {...register( 'name', { required: true })}
            onBlur={() => isPersisted && onUpdate({ name })}
          />
          {name !== snakeCase( name ) && (
            <div className="flex items-center gap-2 mt-2">
              <div>Will be saved as</div>
              <div className="mt-[2px] inline-flex px-2 py-1 rounded text-xs font-mono bg-monoid-300 text-red-500">
                {snakeCase( name )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4">
          <div className="font-bold">Description *</div>
          <div className="text-sm mb-2 italic text-monoid-700">
            Add a short description about what this AI Agent can do.
          </div>
          <TextArea
            className="w-full h-24"
            placeholder="This agent can sail boats."
            defaultValue={getValues( 'description' )}
            disabled={data && !data.isEditable}
            {...register( 'description', { required: true })}
            onBlur={() => isPersisted && onUpdate({ description })}
          />
        </div>
        <div className="mt-4">
          <div className="font-bold">Instructions</div>
          <div className="text-sm mb-2 italic text-monoid-700">
            Give an identity of an AI Agent. This will be used as a system
            message.
          </div>
          <TextArea
            className="w-full h-24"
            placeholder="You are a pirate that can sail boats"
            defaultValue={getValues( 'instructions' )}
            disabled={data && !data.isEditable}
            {...register( 'instructions' )}
            onBlur={() => isPersisted && onUpdate({ instructions })}
          />
        </div>
        <div className="font-bold mt-4">Categories</div>
        <CategoriesMultiDropdown
          disabled={data && !data.isEditable}
          selectedOptionIds={categoryIds}
          onChange={x => {
            setValue( 'categoryIds', x, { shouldDirty: true });
            if ( isPersisted ) {
              onUpdate({ categoryIds: x });
            }
          }}
        />
        <div className="mt-4">
          <div className="font-bold mb-2">Chat UI *</div>
          <div className="flex items-center justify-between">
            <div className="overflow-y-auto whitespace-nowrap min-w-fit pr-4">
              {`${subdomain}.monoid.so/`}
            </div>
            <div className="w-full">
              <Input
                className="w-full"
                defaultValue={getValues( 'slug' )}
                disabled={isPersisted}
                {...register( 'slug', { required: true })}
              />
            </div>
          </div>
          <div className="bg-monoid-300 py-2 px-4 mt-2 rounded-md flex gap-2">
            <FontAwesomeIcon icon={faInfoCircle} className="mt-1" />
            <div className="text-sm whitespace-normal">
              This URL is a unique identifier for the AI Agent. Soon users will
              be able to access the agent from the URL.
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="font-bold mb-2">Make this public?</div>
          <div>
            <Toggle
              defaultChecked={getValues( 'isPublic' )}
              disabled={data && !data.isEditable}
              {...register( 'isPublic' )}
              onChange={x => {
                setValue( 'isPublic', x.target.checked );
                if ( isPersisted ) {
                  onUpdate({ isPublic: x.target.checked });
                }
              }}
            />
          </div>
        </div>
      </div>

      <Button
        className="w-full mt-8"
        variant="invert"
        disabled={isPersisted || !isValid || isCreating || isUpdating}
        onClick={() => {
          if ( isValid ) {
            onCreate({
              ...getValues(),
              url,
              subdomain,
              agentType: 'ReAct Agent',
            });
          }
        }}
      >
        {isPersisted ? (
          isUpdating ? (
            <div className="flex justify-center items-center">
              <span className="mr-4">Updating</span>
              <ScaleLoader color="#ffffff" height={16} />
            </div>
          ) : (
            'Saved'
          )
        ) : (
          <div>{isCreating ? 'Creating Agent...' : 'Continue'}</div>
        )}
      </Button>
    </LayoutOneColumnCentered>
  );
};

export default AgentBasic;
