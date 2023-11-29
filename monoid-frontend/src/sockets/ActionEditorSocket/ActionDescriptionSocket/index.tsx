import { motion } from 'framer-motion';
import { snakeCase } from 'lodash';
import { FC } from 'react';
import { useFormContext } from 'react-hook-form';
import Toggle from 'react-toggle';
import Input from 'src/components/0100_input';
import Pill from 'src/components/0100_pill';
import TextArea from 'src/components/0100_textarea';
import CategoriesMultiDropdown from 'src/sockets/CategoriesMultiDropdown';

interface IProps {
  isReadOnly?: boolean;
  isCreating: boolean;
  onUpdate: ({ overrideParam }: { overrideParam?: never }) => void;
}

const ActionDescriptionSocket: FC<IProps> = ({ isReadOnly, onUpdate }) => {
  const { register, setValue, watch } = useFormContext();

  return (
    <motion.div
      initial={{ opacity: 0, marginLeft: 32 }}
      animate={{ opacity: 1, marginLeft: 0 }}
      exit={{ opacity: 0, marginLeft: '-100vw' }}
    >
      <p className="font-bold text-monoid-900 text-xl mt-[6px]">
        Action Information
      </p>
      <div className="font-bold mt-4">Action Name *</div>
      <Input
        disabled={isReadOnly}
        className="w-full"
        {...register( 'actionInfo.name', { required: true })}
        onBlur={() => onUpdate({})}
      />
      {watch( 'actionInfo.name' ) !== snakeCase( watch( 'actionInfo.name' )) && (
        <div className="flex items-center gap-2 mt-2">
          <div>Will be saved as</div>
          <div className="mt-[2px] inline-flex px-2 py-1 rounded text-xs font-mono bg-monoid-300 text-red-500">
            {snakeCase( watch( 'actionInfo.name' ))}
          </div>
        </div>
      )}

      <div className="font-bold mt-4">Short Description *</div>
      <Input
        disabled={isReadOnly}
        className="w-full"
        {...register( 'actionInfo.description', { required: true })}
        onBlur={() => onUpdate({})}
      />
      <div className="font-bold mt-4">Follow-up Prompt *</div>
      <TextArea
        className="w-full"
        rows={4}
        disabled={isReadOnly}
        {...register( 'actionInfo.followupPrompt' )}
        onBlur={() => onUpdate({})}
      />

      {/* <div className="font-bold text-lg mt-4">Template URL *</div>
      <Input
        className="w-full"
        {...register( 'templateUrl', { required: true })}
      /> */}
      {/* <div className="font-bold text-lg mt-4">HTTP Method</div>
      <InlineSelect
        className="w-24"
        selectedOption={watch( 'method' )}
        options={[{ value: 'GET' }, { value: 'POST' }, { value: 'PUT' }]}
        onChange={val => setValue( 'method', val, { shouldDirty: true })}
      /> */}
      <div className="font-bold text-lg mt-4">Categories</div>
      <CategoriesMultiDropdown
        disabled={isReadOnly}
        selectedOptionIds={watch( 'categoryIds' )}
        onBlur={() => onUpdate({})}
        onChange={x => {
          setValue( 'categoryIds', x, { shouldDirty: true });
        }}
      />

      <div className="flex items-center font-bold text-lg mt-8 gap-2">
        <div className="text-monoid-900/50">Human In The Loop</div>
        <Pill variant="dark">Coming Soon</Pill>
      </div>
      <div className="pl-4 mt-2 opacity-50 cursor-not-allowed pointer-events-none">
        <div className="mt-1 flex items-center ">
          <div className="font-semibold mb-2 mr-4">
            Require End-User Confirmation
          </div>
          <div>
            <Toggle
              disabled={isReadOnly}
              checked={watch( 'actionInfo.isUserConfirmationNeeded' )}
              {...register( 'actionInfo.isUserConfirmationNeeded' )}
              onChange={x => {
                setValue(
                  'actionInfo.isUserConfirmationNeeded',
                  x.target.checked,
                  {
                    shouldDirty: true,
                    shouldTouch: true,
                  },
                );
                onUpdate({});
              }}
            />
          </div>
        </div>
        <div className="mt-1 flex items-center ">
          <div className="font-semibold mb-2 mr-4">
            Require Conversation Manager Approval
          </div>
          <div>
            <Toggle
              disabled={isReadOnly}
              checked={watch( 'actionInfo.isAdminApprovalNeeded' )}
              {...register( 'actionInfo.isAdminApprovalNeeded' )}
              onChange={x => {
                setValue( 'actionInfo.isAdminApprovalNeeded', x.target.checked, {
                  shouldDirty: true,
                  shouldTouch: true,
                });
                onUpdate({});
              }}
            />
          </div>
        </div>
      </div>
      <div className="mt-8 flex items-center ">
        <div className="font-bold mb-2 mr-4 text-lg">Make this public?</div>
        <div>
          <Toggle
            disabled={isReadOnly}
            checked={watch( 'actionInfo.isPublic' )}
            {...register( 'actionInfo.isPublic' )}
            onChange={x => {
              setValue( 'actionInfo.isPublic', x.target.checked, {
                shouldDirty: true,
                shouldTouch: true,
              });
              onUpdate({});
            }}
          />
        </div>
      </div>

      {/* <div className="font-bold text-lg mt-4">Parameters</div>
      {Object.keys( parameters ).map( id => (
        <ActionParameter
          key={id}
          id={Number( id )}
          parameter={parameters[id]}
          onChange={onParameterChange}
          onDelete={onParameterDelete}
        />
      ))}
      <div>
        <ActionParameter
          key="new-parameter"
          parameter={{}}
          onChange={onParameterChange}
        />
      </div> */}

      {/* <Button
        className="w-full mt-8"
        variant="invert"
        disabled={
          !isValid ||
          isUpdating ||
          isCreating ||
          !( isDirty || isParametersModified )
        }
        onClick={onActionChange}
      >
        {Number( id ) > 0
          ? `${isUpdating ? 'Updating...' : 'Update Action'}`
          : `${isCreating ? 'Creating...' : 'Create Action'}`}
      </Button> */}
    </motion.div>
  );
};

export default ActionDescriptionSocket;
