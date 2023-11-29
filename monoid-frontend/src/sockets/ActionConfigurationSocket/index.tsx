import { FC, useCallback } from 'react';
import { useMutation, useQuery } from 'react-query';
import { useParams } from 'react-router-dom';
import ScaleLoader from 'react-spinners/ScaleLoader';
import ActionConfiguration from 'src/components/0200_action_configuration';
import updateAgentConfiguredAction, {
  TActionConfigurationUpdatePayload,
} from 'src/mutations/updateAgentConfiguredAction';
import getUserConfigurables, {
  TGetUserConfigurablesPayload,
  TGetUserConfigurablesResponse,
} from 'src/queries/getUserConfigurables';
import { TUserConfiguredArgument } from 'src/types/userConfiguredArgument';

interface IProps {
  agentName?: string;
  agentDescription?: string;
  actionId: number;
  agentActionId: number;
  configuredArguments: TUserConfiguredArgument[];
}

const ActionConfigurationSocket: FC<IProps> = ({
  agentName,
  agentDescription,
  actionId,
  agentActionId,
  configuredArguments,
}) => {
  const { id } = useParams();
  const { data, isFetching } = useQuery<
    TGetUserConfigurablesPayload,
    unknown,
    TGetUserConfigurablesResponse
  >({
    queryKey: [ 'user-configurables', actionId ],
    queryFn: () => getUserConfigurables({ actionId: Number( actionId ) }),
    enabled: Number( actionId || 0 ) > 0,
  });

  const { mutate: update } = useMutation<
    unknown,
    unknown,
    TActionConfigurationUpdatePayload
  >( updateAgentConfiguredAction );

  const handleConfigurationChange = useCallback(
    ({
      key,
      value,
      placement,
      path,
    }: {
      key: string;
      value: string | number | boolean;
      placement: string;
      path: string;
    }) => {
      if ( data && agentName && agentDescription ) {
        const userConfiguredArguments = data
          .filter( x => x.key !== key )
          .map( x => ({
            key: x.key,
            value: configuredArguments.find( y => y.key === x.key )?.value ?? '',
            placement: x.placement,
            path: x.path,
          }))
          .concat({
            key,
            value,
            placement,
            path,
          });

        update({
          agentId: Number( id ),
          agentActionId,
          name: agentName,
          description: agentDescription,
          userConfiguredArguments,
        });
      }
    },
    [
      agentActionId,
      agentDescription,
      agentName,
      configuredArguments,
      data,
      id,
      update,
    ],
  );

  return (
    <div>
      {isFetching ? (
        <div className="mt-8">
          <ScaleLoader color="#6D4D64" />
        </div>
      ) : (
        ( data || []).map( x => (
          <ActionConfiguration
            {...x}
            key={x.key}
            parameterKey={x.key}
            configuredValue={
              configuredArguments.find( y => y.key === x.key )?.value ?? ''
            }
            onChange={( value: string | number | boolean ) =>
              handleConfigurationChange({
                key: x.key,
                value,
                placement: x.placement,
                path: x.path,
              })
            }
          />
        ))
      )}
    </div>
  );
};

export default ActionConfigurationSocket;
