import { FC, useState } from 'react';

type TProps = {
  tabs: {
    id: string;
    label: string;
    content?: string;
    isTreeTable?: boolean;
  }[];
  defaultTab: string;
  onChange: Function;
};

const Tab: FC<TProps> = ({ tabs, defaultTab, onChange }) => {
  const [ activeTab, setActiveTab ] = useState( defaultTab );

  const changeTab = ( tab: string ) => {
    setActiveTab( tab );
    onChange( tab );
  };

  return (
    <div className="flex gap-[10px]">
      {tabs.map( tab => (
        <button
          type="button"
          key={tab.id}
          onClick={() => changeTab( tab.id )}
          className={`px-[4px] py-[2px] bg-white font-bold text-15 ${
            activeTab === tab.id
              ? 'border-b-[2px] border-b-monoid-900 text-monoid-900'
              : 'text-monoid-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tab;
