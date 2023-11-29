import { FC, useState } from 'react';

import { parameterList } from 'src/utils/constants';
import { TParam } from 'src/contexts/API';
import CustomTreeTable from './components/TreeTable';
import Tab from './components/Tab';

interface IProps {
  isDisabled?: boolean;
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

const APIInformation: FC<IProps> = ({
  isDisabled,
  onUpsertPathParam,
  onRemovePathParam,
  onUpdate,
}) => {
  const [ currentTabId, setCurrentTabId ] = useState( 'headers' );

  const handleTabChange = ( cur: string ) => {
    const currentTab = parameterList.find( item => item.id === cur );
    setCurrentTabId( currentTab?.id ?? 'headers' );
  };

  return (
    <>
      <Tab
        tabs={parameterList}
        defaultTab={currentTabId}
        onChange={( cur: string ) => handleTabChange( cur )}
      />
      <div className="overflow-y-auto mt-[15px]">
        <CustomTreeTable
          isDisabled={isDisabled}
          currentTabId={currentTabId}
          onRemovePathParam={onRemovePathParam}
          onUpsertPathParam={onUpsertPathParam}
          onUpdate={onUpdate}
        />
      </div>
    </>
  );
};

export default APIInformation;
