import { FC, useState } from 'react';
import ScaleLoader from 'react-spinners/ScaleLoader';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from 'react-query';
import getUserConfigurables, {
  TGetUserConfigurablesPayload,
  TGetUserConfigurablesResponse,
} from 'src/queries/getUserConfigurables';
import Pill from '../0100_pill';
import Card from '../0200_card';

type TAction = {
  id: number;
  name: string;
  description: string;
};

interface IProps {
  action: TAction;
  isIncluded?: boolean;
  isEditable?: boolean;
  onClick?: ( data: TGetUserConfigurablesResponse | undefined ) => void;
  onDelete?: ({ id }: { id: number }) => void;
}

const ActionCard: FC<IProps> = ({
  action,
  isEditable = false,
  isIncluded = false,
  onClick,
  onDelete,
}) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { pathname } = useLocation();
  const [ isAdding, setIsAdding ] = useState( false );
  const isActionHub = pathname.includes( '/action_hub' );
  const { data } = useQuery<
    TGetUserConfigurablesPayload,
    unknown,
    TGetUserConfigurablesResponse
  >({
    queryKey: [ 'user-configurables', action.id ],
    queryFn: () => getUserConfigurables({ actionId: Number( action.id ) }),
    enabled: !isActionHub && Number( action.id || 0 ) > 0,
  });

  return (
    <Card
      key={action.id}
      variant={isIncluded ? 'invert' : undefined}
      disabled={isIncluded}
      onClick={() => {
        if ( id ) {
          if ( !isIncluded ) {
            setIsAdding( true );
            onClick?.( data );
          }
        } else {
          navigate( `/actions/${action.id}` );
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-left py-1 flex items-center">
            <div className="pr-2">{action.name}</div>
            {isIncluded && <Pill>Included</Pill>}
          </div>
          <div className="overflow-auto h-[46px] text-sm text-left">
            <div>{action.description}</div>
            {isAdding && (
              <div className="flex">
                Attaching to Agent
                <ScaleLoader
                  color="#6D4D64"
                  height={16}
                  margin={1}
                  className="pl-4"
                />
              </div>
            )}
          </div>
        </div>
        <div>
          {isEditable && (
            <FontAwesomeIcon
              icon={faTrash}
              className="p-4 cursor-pointer"
              onClick={e => {
                e.stopPropagation();
                onDelete?.({ id: action.id });
              }}
            />
          )}
          {/* {!isIncluded && onClick && (
            <div className="flex justify-end">
              <Button variant="invert" onClick={onClick}>
                Add
              </Button>
            </div>
          )} */}
        </div>
      </div>
    </Card>
  );
};

export default ActionCard;
