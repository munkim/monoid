import { FC, useEffect, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ScaleLoader from 'react-spinners/ScaleLoader';
import ActionCategoriesDesktopView from 'src/components/0100_action_categories_desktop_view';
import ActionCategoriesMobileView from 'src/components/0100_action_categories_mobile_view';
import addActionToProject from 'src/mutations/addActionToProject';
import getActionCategories from 'src/queries/getActionCategories';
import getActions from 'src/queries/getActions';
import getAgentConfiguredActions from 'src/queries/getAgentConfiguredActions';
import FloatingFooterNavigation from 'src/components/0100_floating_footer_navigation';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'src/components/0100_button';
import Drawer from 'src/components/0100_drawer';
import Title from 'src/components/0100_title';
import ActionList from '../ActionList';
import AgentsSocket from '../AgentsSocket';

type TActionCategoryListResponse = {
  id: number;
  name: string;
  description: string;
}[];

type TActionListPayload = {
  categoryId: string;
};

type TActionListResponse = {
  id: number;
  name: string;
  description: string;
}[];

type TProjectListActionsPayload = {
  id: number;
};

type TProjectListActionsResponse = {
  actionId: number;
  agentActionId: number;
  name: string;
  description: string;
}[];

const MonoidHub: FC = () => {
  const navigate = useNavigate();
  const [ isDrawerOpen, setIsDrawerOpen ] = useState( false );
  const { id } = useParams();
  const redirectDestination = id
    ? `/agents/${id}/actions/new?on_create=/agents/${id}/actions`
    : '/actions/new';
  const [ categoryId, setCategoryId ] = useState<string>( 'my_actions' );
  const { data: categories, isFetching: isFetchingCategories } = useQuery<
    unknown,
    unknown,
    TActionCategoryListResponse
  >({
    queryKey: [ 'actionCategories' ],
    queryFn: getActionCategories,
  });

  const { data: actions, isFetching: isFetchingActions } = useQuery<
    TActionListPayload,
    unknown,
    TActionListResponse
  >({
    queryKey: [ 'actionCategories', categoryId ],
    queryFn: () => getActions({ categoryId: String( categoryId ) }),
    enabled: !!categoryId,
  });

  const { data: projectActions } = useQuery<
    TProjectListActionsPayload,
    unknown,
    TProjectListActionsResponse
  >({
    queryKey: [ 'agent', id, 'actions' ],
    queryFn: () => getAgentConfiguredActions({ id: Number( id ) }),
    enabled: Number( id || 0 ) > 0,
  });

  const { mutate: addAction } = useMutation( addActionToProject, {
    onSuccess() {
      navigate( `/agents/${id}/config` );
    },
  });

  useEffect(() => {
    if ( categories && categories.length > 0 && !categoryId ) {
      setCategoryId( String( categories[0].id ));
    }
  }, [ categories, categoryId, navigate ]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-12 md:gap-4">
        <div className="col-span-12 md:col-span-4 lg:col-span-3 xl:col-span-2 sticky top-0">
          <ActionCategoriesMobileView
            categories={categories || []}
            selectedCategoryId={categoryId}
            onCategoryChange={({ categoryId }) => setCategoryId( categoryId )}
          />
          <ActionCategoriesDesktopView
            categories={categories || []}
            selectedCategoryId={categoryId}
            onCategoryChange={({ categoryId }) => setCategoryId( categoryId )}
            isFetching={isFetchingCategories}
          />
        </div>

        <div className="col-span-12 md:col-span-8 lg:col-span-9 xl:col-span-10 grid grid-cols-1 gap-8">
          <div className="min-h-[25vh]">
            <Title>🤖 Agents</Title>
            <AgentsSocket
              categoryId={
                categoryId === 'my_actions' ? undefined : Number( categoryId )
              }
              excludedAgentId={id ? Number( id ) : undefined}
            />
          </div>

          <div className="min-h-[50vh]">
            <Title>⚡ API Actions</Title>
            <div>
              {isFetchingActions && <ScaleLoader color="#6D4D64" />}
              {!isFetchingActions && actions && (
                <ActionList
                  actions={actions}
                  selectedActionIds={( projectActions || []).map(
                    x => x.actionId,
                  )}
                  isEditable={!id && categoryId === 'my_actions'}
                  onActionChange={({ action, data }) => {
                    if ( id ) {
                      addAction({
                        agentId: Number( id ),
                        payload: {
                          ...action,
                          actionId: action.id,
                          userConfiguredArguments: data
                            ? data.map( x => ({
                                ...x,
                                value: '',
                              }))
                            : undefined,
                        },
                      });
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {!id && (
        <FloatingFooterNavigation>
          <div className="flex justify-end gap-4">
            <Button variant="invert">
              <Link to={redirectDestination} className="px-8 flex items-center">
                <FontAwesomeIcon icon={faPlus} className="text-xl mr-2" />
                <div className="hidden sm:inline-flex sm:ml-2">
                  Create New Action
                </div>
                <div className="inline-flex sm:hidden">⚡</div>
              </Link>
            </Button>
            <Button variant="invert">
              <Link to="/agents/new" className="px-8 flex items-center">
                <FontAwesomeIcon icon={faPlus} className="text-xl mr-2" />
                <div className="hidden sm:inline-flex sm:ml-2">
                  Create New Agent
                </div>
                <div className="inline-flex sm:hidden">🤖</div>
              </Link>
            </Button>
          </div>
        </FloatingFooterNavigation>
      )}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen( false )}>
        This is a drawer
      </Drawer>
    </div>
  );
};

export default MonoidHub;
