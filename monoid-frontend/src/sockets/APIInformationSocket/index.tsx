import { FC, useCallback, useContext, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { useFormContext } from 'react-hook-form';

import APIInformation from 'src/components/api_information';
import Dropdown from 'src/components/0100_dropdown';
import Input from 'src/components/0100_input';
import { httpMethodListMap } from 'src/utils/constants';
import APIContext, { TParam } from 'src/contexts/API';
import { v4 } from 'uuid';
import ScaleLoader from 'react-spinners/ScaleLoader';
import { AnimatePresence, motion } from 'framer-motion';

interface IProps {
  isReadOnly?: boolean;
  isUpdating: boolean;
  isUpdated: boolean;
  onUpsertPathParam: ({
    key,
    newValue,
  }: {
    key: string;
    newValue: string;
  }) => void;
  onRemovePathParam: ( val: string ) => void;
  onUpdate: ({ overrideParam }: { overrideParam?: TParam[] }) => void;
}

const APIInformationSocket: FC<IProps> = ({
  isReadOnly = false,
  isUpdating = false,
  isUpdated = false,
  onUpsertPathParam,
  onRemovePathParam,
  onUpdate,
}) => {
  const xRef = useRef<HTMLInputElement>();
  const { param, setParam } = useContext( APIContext );

  const { register, setValue, watch } = useFormContext();
  const { name, ref } = register( 'apiInfo.templateUrl' );

  const endpoint = watch( 'apiInfo.templateUrl' );

  const processEndpoint = useCallback(
    ( newValue: string, cursorPosition: number ) => {
      const isAdding = newValue.length === endpoint.length + 1;
      const isAddingOpenCurl = isAdding && newValue[cursorPosition - 1] === '{';
      const isAddingCloseCurl =
        isAdding && newValue[cursorPosition - 1] === '}';
      const isRemoving = newValue.length < endpoint.length;
      const isRemovingOpenCurl =
        isRemoving &&
        endpoint[cursorPosition] === '{' &&
        newValue[cursorPosition] === '}';

      if ( isAddingOpenCurl ) {
        const autoClosed = [
          newValue.slice( 0, cursorPosition ),
          '}',
          newValue.slice( cursorPosition ),
        ].join( '' );

        setTimeout(
          () => xRef.current?.setSelectionRange( cursorPosition, cursorPosition ),
          10,
        );

        return setValue( 'apiInfo.templateUrl', autoClosed );
      }

      if ( isAddingCloseCurl ) {
        setTimeout(
          () =>
            xRef.current?.setSelectionRange(
              cursorPosition + 1,
              cursorPosition + 1,
            ),
          10,
        );

        return setValue( 'apiInfo.templateUrl', endpoint );
      }

      if ( isRemovingOpenCurl ) {
        const autoClosed = [
          newValue.slice( 0, cursorPosition ),
          newValue.slice( cursorPosition + 1 ),
        ].join( '' );

        setTimeout(
          () => xRef.current?.setSelectionRange( cursorPosition, cursorPosition ),
          10,
        );

        return setValue( 'apiInfo.templateUrl', autoClosed );
      }

      return setValue( 'apiInfo.templateUrl', newValue );
    },
    [ endpoint, setValue ],
  );

  const syncTemplateToPathParams = useCallback(() => {
    const paramsFromTemplate =
      ( endpoint as string )
        .match( /{([^}]+)}/g )
        ?.map( x => x.replace( '{', '' ).replace( '}', '' )) || [];

    const oldPathParams =
      param.find( x => x.tabId === 'path-params' )?.data || [];
    const existingKeys = oldPathParams.map( x => x.data );
    const keysToAdd = paramsFromTemplate
      .filter( x => !existingKeys.map( k => k.api_key ).includes( x ))
      .map( x => ({
        key: v4(),
        data: {
          api_key: x,
          value: 'New Value',
          description: 'New Description',
          dataType: 'string',
          argumentProvider: 'user',
        },
      }));

    const keysToRemove = existingKeys
      .filter(
        x =>
          !paramsFromTemplate.includes( x.api_key ) &&
          !x.isAddButtonRow &&
          x.description.trim() !== 'New Value' &&
          x.value.trim() !== 'New Description',
      )
      .map( x => x.api_key );

    const newPathParams = [
      ...keysToAdd,
      ...oldPathParams.filter( x => !keysToRemove.includes( x.data.api_key )),
    ];

    setParam(
      param.map( x => {
        if ( x.tabId === 'path-params' ) {
          return {
            ...x,
            data: newPathParams,
          };
        }
        return x;
      }),
    );
  }, [ endpoint, param, setParam ]);

  return (
    <div className="flex-auto w-full bg-white">
      <div className="flex items-center justify-between">
        <p className="font-bold text-monoid-900 text-xl mt-[6px]">
          API Information
        </p>
        <div className="flex items-center justify-center">
          <p className="pl-[12px] font-semibold text-11 text-monoid-900 flex items-center">
            {isUpdating && (
              <>
                <ScaleLoader
                  color="#6D4D64"
                  height={16}
                  margin={1}
                  width={4}
                  className="mr-2"
                />
                Saving...
              </>
            )}
            <AnimatePresence>
              {isUpdated && (
                <motion.div
                  className="flex items-center"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="mr-2 text-lg"
                  />
                  Saved!
                </motion.div>
              )}
            </AnimatePresence>
          </p>
        </div>
      </div>

      <div className="mt-[35px]">
        <p className="mb-[8px] font-bold text-monoid-900 text-16">
          Template URL
        </p>
        <div className="flex gap-[10px]">
          <div className="w-1/4">
            <Dropdown
              isDisabled={isReadOnly}
              options={httpMethodListMap}
              selectedOption={watch( 'apiInfo.method' )}
              onChange={val => {
                setValue( 'apiInfo.method', val );
                onUpdate({});
              }}
              // selectedOption={currentHttpMethod}
              // onChange={val => setCurrentHttpMethod( val )}
            />
          </div>
          <Input
            disabled={isReadOnly}
            className="px-[10px] py-[5px] w-full"
            name={name}
            ref={( x: HTMLInputElement ) => {
              ref( x );
              xRef.current = x;
            }}
            onChange={x => {
              processEndpoint( x.target.value, x.target.selectionStart || 0 );
            }}
            onBlur={() => {
              syncTemplateToPathParams();
              onUpdate({});
            }}
          />
        </div>
      </div>

      <div className="mt-[35px]">
        <p className="font-bold text-monoid-900 text-16">Parameters</p>
        <div className="relative mt-[10px]">
          <APIInformation
            isDisabled={isReadOnly}
            onRemovePathParam={onRemovePathParam}
            onUpsertPathParam={onUpsertPathParam}
            onUpdate={onUpdate}
          />
        </div>
      </div>

      {/* <FullScreenModal
        isOpen={isOpen}
        hideClose
        onClose={() => setIsOpen( false )}
      >
        <div className="max-w-3xl px-[20px] pb-[20px] pt-[15px]">
          <div className="flex items-center justify-between gap-30">
            <div>
              <p className="font-bold text-16 text-monoid-900">
                Load Parameters From JSON
              </p>
              <p className="text-13 text-monoid-900">
                Using the JSON (description and strength are not included)
              </p>
            </div>
            <Button
              variant="invert"
              className="py-[6px] border-none rounded-lg pl-[15px] pr-[15px] text-15"
              onClick={() => setIsOpen( false )}
            >
              Save
            </Button>
          </div>
          <CodeEditor />
        </div>
      </FullScreenModal> */}
    </div>
  );
};

export default APIInformationSocket;
