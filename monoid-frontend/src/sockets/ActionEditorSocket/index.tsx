import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { chain, isArray, omit, snakeCase } from 'lodash';
import { useMutation, useQuery, useQueryClient } from 'react-query';

import createAction, {
  TApiActionCreatePayload,
} from 'src/mutations/createAction';
import updateAction, {
  TApiActionUpdatePayload,
} from 'src/mutations/updateAction';
import useUserContext from 'src/hooks/useUserContext';

import APIContext, { TParam, initialState } from 'src/contexts/API';
import { TreeNode } from 'primereact/treenode';
import getApiAction, {
  TGetApiActionPayload,
  TGetApiActionResponse,
} from 'src/queries/getApiAction';
import { v4 } from 'uuid';
import { useIntervalWhen } from 'rooks';
import camelcaseKeys from 'camelcase-keys';
import Button from 'src/components/0100_button';
import addActionToProject from 'src/mutations/addActionToProject';
import getUserConfigurables, {
  TGetUserConfigurablesPayload,
  TGetUserConfigurablesResponse,
} from 'src/queries/getUserConfigurables';
import snakecaseKeys from 'snakecase-keys';
import { TCategory } from 'src/types/category';
import { TRecursive } from 'src/types/recursive';
import ActionDescriptionSocket from './ActionDescriptionSocket';
import APIInformationSocket from '../APIInformationSocket';
import APITestingSocket from '../APITestingSocket';

type TApiActionCreateResponse = {
  actionId: number;
};

type TApiActionUpdateResponse = {
  actionInfo: {
    name: string;
    description: string;
    followupPrompt: string;
    isPublic: boolean;
    isUserConfirmationNeeded: boolean;
    isAdminApprovalNeeded: boolean;
  };
  apiInfo: {
    method: string;
    templateUrl: string;
    headers: TRecursive;
    queryParameters: TRecursive;
    pathParameters: TRecursive;
    body: TRecursive;
  };
  categories: TCategory[];
  actionId: number;
};

type TTableBase = {
  key: string;
  value: string;
  description: string;
  data_type: string;
  is_required: boolean;
  argument_provider: string;
};

type TTableData = TTableBase | Record<string, TTableBase>;

const ActionEditorSocket: FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [ searchParams ] = useSearchParams();
  const [ param, setParam ] = useState<TParam[]>( initialState );
  const [ isParamLoaded, setIsParamLoaded ] = useState( false );
  const [ isUpdated, setIsUpdated ] = useState( false );
  const redirectOnCreate = searchParams.get( 'on_create' );
  const redirectToAgentId = Number( redirectOnCreate?.match( /\d+/ )?.[0]);
  const { actionId: id } = useParams();
  const { setActiveModal } = useUserContext();
  const methods = useForm({
    defaultValues: {
      actionInfo: {
        name: '',
        description: '',
        followupPrompt: '',
        isPublic: false,
        isUserConfirmationNeeded: false,
        isAdminApprovalNeeded: false,
      },
      apiInfo: {
        method: 'GET',
        templateUrl: '',
      },
      categoryIds: [] as number[],
    },
  });
  const {
    reset,
    setValue,
    watch,
    formState: { isValid },
  } = methods;
  const apiContextValue = useMemo(
    () => ({ param, setParam }),
    [ param, setParam ],
  );

  const isReallyValid = isValid; // && watch( 'categoryIds' ).length > 0;

  const { data, refetch } = useQuery<
    TGetApiActionPayload,
    unknown,
    TGetApiActionResponse
  >({
    queryKey: [ 'api-action', id ],
    queryFn: () => getApiAction({ actionId: Number( id ) }),
    enabled: Number( id || 0 ) > 0,
  });

  const { data: userConfigurables, refetch: refetchUserConfigurables } =
    useQuery<
      TGetUserConfigurablesPayload,
      unknown,
      TGetUserConfigurablesResponse
    >({
      queryKey: [ 'user-configurables', id ],
      queryFn: () => getUserConfigurables({ actionId: Number( id ) }),
      enabled: false,
    });

  const isReadOnly = !!id && id !== 'new' && !data?.isEditable;

  const { mutate: create, isLoading: isCreating } = useMutation<
    TApiActionCreateResponse,
    unknown,
    TApiActionCreatePayload
  >( createAction, {
    onSuccess( data ) {
      if ( redirectOnCreate ) {
        navigate( `/actions/${data.actionId}?on_create=${redirectOnCreate}` );
      } else {
        navigate( `/actions/${data.actionId}` );
      }

      setActiveModal({
        title: 'Action Created',
        type: 'success',
        children: 'Action successfully created.',
      });
      refetchUserConfigurables();
    },
  });

  const { mutate: addAction, isLoading: isAttachingToAgent } = useMutation(
    addActionToProject,
    {
      onSuccess() {
        navigate( `/agents/${redirectToAgentId}/config` );
      },
    },
  );

  const { mutate: update, isLoading: isUpdating } = useMutation<
    TApiActionUpdateResponse,
    unknown,
    TApiActionUpdatePayload
  >( updateAction, {
    onSuccess( data ) {
      reset({
        ...omit( data, 'parameters', 'categories' ),
        categoryIds: data.categories.map( x => x.categoryId ),
      });
      setIsUpdated( true );
      queryClient.invalidateQueries([ 'action', id, 'details' ]);
      queryClient.invalidateQueries([ 'api-action', id ]);
      refetchUserConfigurables();
    },
  });

  const transformParams = useCallback(( t: TreeNode[] | undefined ) => {
    if ( !t ) return {};

    // recursively transform an array of objects into a nested object
    const transform: any = ( x: TreeNode[]) =>
      chain( x )
        .filter( x => !x.data.isAddButtonRow )
        .map( y => {
          if ( isArray( y.children ) && y.children.length > 1 ) {
            return [ y.data.api_key, transform( y.children ) ];
          }

          return [
            y.data.api_key,
            snakecaseKeys({ ...y.data, key: y.data.api_key, isRequired: true }),
          ];
        })
        .fromPairs()
        .value();

    return transform( t );
  }, []);

  const unTransformParams = useCallback(
    ( t: TRecursive, isTreeTable = false ) => {
      // recursively transform nested objects into an array of objects
      const transform: any = ( x: TTableData, parentCount = 0 ) =>
        Object.entries( x ).map(([ key, val ]) => {
          // console.log( 'size of ', val, Object.keys( val ).length );

          // if ( Object.keys( val ).length === 1 ) {
          if ( !val.value ) {
            return {
              key,
              data: {
                api_key: key,
                value: '',
                description: '',
              },
              children: [
                ...transform( val, key, parentCount + 1 ),
                {
                  key: v4(),
                  data: {
                    api_key: '',
                    value: '',
                    description: ``,
                    argumentProvider: '',
                    dataType: '',
                    isAddButtonRow: true,
                    parentId: key,
                    parentCount: parentCount + 1,
                  },
                },
              ],
            };
          }

          return isTreeTable
            ? {
                key,
                // data: { ...transform( val ), api_key: key },
                data: { ...camelcaseKeys( val ), api_key: key },
                children: [
                  {
                    key: v4(),
                    data: {
                      api_key: '',
                      value: '',
                      description: '',
                      argumentProvider: '',
                      dataType: '',
                      isAddButtonRow: true,
                      parentId: key,
                      parentCount: parentCount + 1,
                    },
                  },
                ],
                // children: transform( val ),
              }
            : { key, data: { ...camelcaseKeys( val ), api_key: key }};
        });

      // console.log( transform( t ));
      if ( Object.keys( t ).length === 0 )
        return [
          {
            key: v4(),
            data: {
              api_key: '',
              value: '',
              description: '',
              argumentProvider: '',
              dataType: '',
              isAddButtonRow: true,
              parentId: undefined,
              parentCount: 0,
            },
          },
        ];

      return [
        ...transform( t ),
        {
          key: v4(),
          data: {
            api_key: '',
            value: '',
            description: '',
            argumentProvider: '',
            dataType: '',
            isAddButtonRow: true,
            parentId: undefined,
            parentCount: 0,
          },
        },
      ];
      // return [
      //   transform( t ),

      //   // {
      //   //   key: v4(),
      //   //   data: {
      //   //     api_key: '',
      //   //     value: '',
      //   //     description: '',
      //   //     argumentProvider: '',
      //   //     dataType: '',
      //   //     isAddButtonRow: true,
      //   //     parentId: undefined,
      //   //     parentCount: 0,
      //   //   },
      //   // },
      // ];
    },
    [],
  );

  const handleCreate = useCallback(() => {
    create({
      // ...watch(),
      actionInfo: {
        ...watch( 'actionInfo' ),
        snakeCaseName: snakeCase( watch( 'actionInfo.name' )),
      },
      categoryIds: watch( 'categoryIds' ),
      apiInfo: {
        ...watch( 'apiInfo' ),
        headers: transformParams( param.find( x => x.tabId === 'headers' )?.data ),
        queryParameters: transformParams(
          param.find( x => x.tabId === 'query-params' )?.data,
        ),
        pathParameters: transformParams(
          param.find( x => x.tabId === 'path-params' )?.data,
        ),
        body: transformParams( param.find( x => x.tabId === 'body' )?.data ),
      },
    });
  }, [ create, param, transformParams, watch ]);

  const handleUpdate = useCallback(
    ({ overrideParam }: { overrideParam?: TParam[] }) => {
      if ( id === 'new' || !id ) return;

      const actualParam = overrideParam || param;
      setIsUpdated( false );
      update({
        id: Number( id ),
        categoryIds: watch( 'categoryIds' ),
        actionInfo: {
          ...omit( watch().actionInfo, 'actionId', 'snakeCaseName' ),
          snakeCaseName: snakeCase( watch( 'actionInfo.name' )),
        },
        apiInfo: {
          ...watch( 'apiInfo' ),
          headers: transformParams(
            actualParam.find( x => x.tabId === 'headers' )?.data,
          ),
          queryParameters: transformParams(
            actualParam.find( x => x.tabId === 'query-params' )?.data,
          ),
          pathParameters: transformParams(
            actualParam.find( x => x.tabId === 'path-params' )?.data,
          ),
          body: transformParams(
            actualParam.find( x => x.tabId === 'body' )?.data,
          ),
        },
      });
    },
    [ id, watch, update, transformParams, param ],
  );

  const handleRemovePathParam = useCallback(
    ( x: string ) => {
      const newEndpoint = watch( 'apiInfo.templateUrl' ).replace( `{${x}}`, '' );
      setValue( 'apiInfo.templateUrl', newEndpoint );
    },
    [ setValue, watch ],
  );

  const handleUpsertPathParam = useCallback(
    ({ key, newValue }: { key: string; newValue: string }) => {
      const templateUrl = watch( 'apiInfo.templateUrl' );
      const pathParam = param.find( item => item.tabId === 'path-params' );
      const keyForReplacement = pathParam?.data.find( item => item.key === key );
      const oldValue = keyForReplacement?.data.api_key;

      if ( templateUrl.includes( `{${oldValue}}` )) {
        setValue(
          'apiInfo.templateUrl',
          templateUrl.replace( `{${oldValue}}`, `{${newValue}}` ),
        );
      } else {
        setValue( 'apiInfo.templateUrl', `${templateUrl}{${newValue}}` );
      }
    },
    [ param, setValue, watch ],
  );

  useEffect(() => {
    if ( Number( id || 0 ) > 0 && data ) {
      if ( !isParamLoaded ) {
        reset({
          ...data,
          categoryIds: data.categories.map( x => x.categoryId ),
        });

        setParam([
          {
            tabId: 'headers',
            data: unTransformParams( data.raw.headers ),
          },
          {
            tabId: 'query-params',
            data: unTransformParams( data.raw.queryParameters ),
          },
          {
            tabId: 'path-params',
            data: unTransformParams( data.raw.pathParameters ),
          },
          {
            tabId: 'body',
            data: unTransformParams( data.raw.body, true ),
          },
        ]);

        setIsParamLoaded( true );
      }
    }
  }, [ data, id, isParamLoaded, reset, unTransformParams ]);

  useEffect(() => {
    if ( Number( id || 0 ) > 0 ) {
      refetch();
    }
  }, [ id, refetch ]);

  useEffect(() => {
    if ( Number( id || 0 ) > 0 ) {
      refetchUserConfigurables();
    }
  }, [ id, refetchUserConfigurables ]);

  useIntervalWhen(
    () => {
      setIsUpdated( false );
    },
    2000,
    isUpdated,
  );

  return (
    <FormProvider {...methods}>
      <APIContext.Provider value={apiContextValue}>
        <div className="flex w-full gap-4">
          <div className="w-[67vw] relative">
            <div className="mb-8">
              <APIInformationSocket
                isReadOnly={isReadOnly}
                isUpdating={isUpdating}
                isUpdated={isUpdated}
                onRemovePathParam={handleRemovePathParam}
                onUpsertPathParam={handleUpsertPathParam}
                onUpdate={({ overrideParam }) => {
                  setTimeout(() => handleUpdate({ overrideParam }), 500 );
                }}
              />
              <div className="absolute top-0 right-0">
                {id && id !== 'new' && redirectOnCreate && (
                  <Button
                    disabled={isAttachingToAgent}
                    variant="invert"
                    onClick={() => {
                      addAction({
                        agentId: redirectToAgentId,
                        payload: {
                          actionId: Number( id ),
                          name: String( data?.actionInfo.name ),
                          description: String( data?.actionInfo.description ),
                          userConfiguredArguments: userConfigurables?.map(
                            x => ({ ...x, value: '' }),
                          ),
                        },
                      });
                    }}
                  >
                    {isAttachingToAgent
                      ? 'Attaching to Agent...'
                      : 'Attach to Agent'}
                  </Button>
                )}
                {( id === 'new' || !id ) && (
                  <Button
                    className="w-full"
                    variant="invert"
                    disabled={!isReallyValid || isCreating}
                    onClick={() =>
                      isReallyValid && !isCreating && handleCreate()
                    }
                  >
                    {isCreating ? 'Creating...' : 'Create Action'}
                  </Button>
                )}
              </div>
            </div>
            <ActionDescriptionSocket
              isReadOnly={isReadOnly}
              isCreating={isCreating}
              onUpdate={handleUpdate}
            />
          </div>
          <div className="w-[33vw]">
            <APITestingSocket />
          </div>
        </div>
      </APIContext.Provider>
    </FormProvider>
  );
};

export default ActionEditorSocket;
