/* eslint-disable jsx-a11y/interactive-supports-focus */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/no-unstable-nested-components */
import React, { FC, useContext, useEffect, useState } from 'react';
import clsx from 'clsx';
import { Column, ColumnEditorOptions } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { TreeNode } from 'primereact/treenode';
import {
  TreeTable,
  TreeTableTogglerTemplateOptions,
} from 'primereact/treetable';

import APIContext, { TParam } from 'src/contexts/API';
import AddIcon from 'src/assets/add.svg';
import ArrowDownIcon from 'src/assets/down.svg';
import ArrowRightIcon from 'src/assets/right.svg';
import ColorArrowDownIcon from 'src/assets/down-color.svg';
import ColorArrowRightIcon from 'src/assets/right-color.svg';
import Dropdown from 'src/components/0100_dropdown';
import RemoveIcon from 'src/assets/remove.svg';

import 'primereact/resources/themes/lara-light-indigo/theme.css';
import {
  argumentProviderList,
  dataTypeList,
  parameterList,
} from 'src/utils/constants';
import { v4 } from 'uuid';
import { startCase } from 'lodash';

interface IProps {
  currentTabId: string;
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

const togglerTemplate = (
  node: TreeNode,
  options: TreeTableTogglerTemplateOptions,
) => {
  if ( node.data?.isAddButtonRow ) {
    return null;
  }

  const { expanded } = options;
  const hasChildren = node.children && node.children.length > 1;
  const arrowIcon = hasChildren
    ? expanded
      ? ColorArrowDownIcon
      : ColorArrowRightIcon
    : expanded
    ? ArrowDownIcon
    : ArrowRightIcon;

  return (
    <button
      type="button"
      className="p-treetable-toggler p-link"
      style={options.buttonStyle}
      tabIndex={-1}
      onClick={options.onClick}
    >
      <img src={arrowIcon} alt="arrow" />
    </button>
  );
};

const CustomTreeTable: FC<IProps> = ({
  currentTabId,
  isDisabled,
  onUpsertPathParam,
  onRemovePathParam,
  onUpdate,
}) => {
  const marginLeftUnit = 16;
  const isTreeTable = parameterList.find(
    item => item.id === currentTabId,
  )?.isTreeTable;

  const { param, setParam } = useContext( APIContext );
  const [ treeData, setTreeData ] = useState<TreeNode[]>([]);

  const updateParamContext = ( node: TreeNode[], forceUpdate = false ) => {
    const updatedParam = param.map( item => {
      if ( item.tabId === currentTabId ) {
        return {
          ...item,
          data: node,
        };
      }
      return item;
    });
    setParam( updatedParam );

    if ( forceUpdate ) {
      onUpdate({ overrideParam: updatedParam });
    }
  };

  const findNodeByKey: any = ( data: TreeNode[], key: string ) => {
    for ( let i = 0; i < data.length; i++ ) {
      const node = data[i];
      if ( node.key === key ) {
        return node;
      }

      if ( node.children ) {
        const result = findNodeByKey( node.children, key );
        if ( result ) {
          return result;
        }
      }
    }
    return null;
  };

  const handleAddNode = ( node: TreeNode ) => {
    const {
      data: { parentId, parentCount },
    } = node;
    const newParentKey = v4();
    const newKey = v4();

    const newNodeItem: TreeNode = {
      key: newParentKey,
      data: {
        api_key: 'New Key',
        value: 'New Value',
        description: 'New Description',
        dataType: 'string',
        argumentProvider: 'user',
        parentCount: parentId ? parentCount : 0,
      },
      children: isTreeTable
        ? [
            {
              key: newKey,
              data: {
                api_key: '',
                value: '',
                description: '',
                argumentProvider: '',
                isAddButtonRow: true,
                parentId: newParentKey,
                parentCount: parentCount + 1,
              },
            },
          ]
        : undefined,
    };

    setTreeData( prevState => {
      const newData = [ ...prevState ];

      if ( parentId ) {
        const parent = findNodeByKey( newData, parentId );
        if (
          !parent.children.some(( child: TreeNode ) => child.key === newParentKey )
        ) {
          parent.children.splice( parent.children.length - 1, 0, newNodeItem );
        }
      } else {
        newData.splice( newData.length - 1, 0, newNodeItem );
      }

      updateParamContext( newData );

      return newData;
    });
  };

  const handleRemoveNode = ( key: string ) => {
    setTreeData( prevState => {
      const newData = [ ...prevState ];

      const removeNodeRecursive = ( data: TreeNode[]) => {
        for ( let i = 0; i < data.length; i++ ) {
          const node = data[i];
          if ( node.key === key ) {
            data.splice( i, 1 );
            return;
          }
          if ( node.children ) {
            removeNodeRecursive( node.children );
          }
        }
      };

      removeNodeRecursive( newData );
      updateParamContext( newData, true );

      return newData;
    });
  };

  const actionTemplate = ( node: TreeNode ) =>
    !node.data?.isAddButtonRow && (
      <button
        type="button"
        className="border-none text-[#868FA0] w-8 mt-1"
        onClick={() => {
          handleRemoveNode(( node?.key ?? '' ).toString());

          if ( currentTabId === 'path-params' ) {
            onRemovePathParam( node.data.api_key );
          }
        }}
      >
        <img src={RemoveIcon} alt="remove" />
      </button>
    );

  const onEditorValueChange = (
    options: ColumnEditorOptions,
    value: string,
    forceUpdate = false,
  ) => {
    const newNodes = JSON.parse( JSON.stringify( treeData ));
    const editedNode = findNodeByKey( newNodes, options.node.key );

    editedNode.data[options.field] = value;

    setTreeData( newNodes );
    updateParamContext( newNodes, forceUpdate );

    // if ( forceUpdate ) {
    //   onUpdate({ overrideParam: newNodes });
    // }
  };

  const inputTextEditor = ( options: ColumnEditorOptions ) => (
    <InputText
      type="text"
      className={clsx( 'px-[10px] py-[5px]', {
        'text-left': options.field === 'api_key',
        'text-right': options.field !== 'api_key',
      })}
      value={options.rowData[options.field]}
      onFocus={x => x.target.select()}
      onBlur={() => onUpdate({})}
      onChange={( e: React.ChangeEvent<HTMLInputElement> ) => {
        if ( options.field === 'api_key' && currentTabId === 'path-params' ) {
          onUpsertPathParam({
            key: options.node.key,
            newValue: e.target.value,
          });
        }
        onEditorValueChange( options, e.target.value );
      }}
    />
  );

  const handleTextEditor = ( options: ColumnEditorOptions ) =>
    !options.node.data.isAddButtonRow ? (
      isDisabled ? (
        <div>{options.value}</div>
      ) : (
        inputTextEditor( options )
      )
    ) : options.field === 'api_key' ? (
      <div
        className="flex items-center text-14 text-[#868FA0]"
        role="button"
        style={{
          marginLeft: marginLeftUnit * options.node.data.parentCount,
          zIndex: 995,
        }}
        onClick={() => !isDisabled && handleAddNode( options.node )}
      >
        <button
          type="button"
          className="border-none p-treetable-toggler p-link"
          tabIndex={-1}
        >
          {!isDisabled && <img src={AddIcon} alt="remove" />}
        </button>
        <span className="pl-4 italic">
          {isDisabled ? 'Read-Only Field' : 'Add New Key'}
        </span>
      </div>
    ) : null;

  const handleArgumentProviderDropdownEditor = ( options: ColumnEditorOptions ) =>
    isDisabled ? (
      <div>
        {startCase(
          argumentProviderList.find( x => x.value === options.value )?.label,
        )}
      </div>
    ) : (
      <Dropdown
        options={argumentProviderList}
        selectedOption={options.node.data?.argumentProvider}
        onChange={val => {
          onEditorValueChange( options, val, true );
        }}
        className="text-14"
      />
    );
  const handleDataTypeDropdownEditor = ( options: ColumnEditorOptions ) =>
    isDisabled ? (
      <div>{startCase( options.value )}</div>
    ) : (
      <Dropdown
        options={dataTypeList}
        selectedOption={options.node.data.dataType}
        onChange={val => {
          onEditorValueChange( options, val, true );
        }}
        className="text-14"
      />
    );

  useEffect(() => {
    setTreeData( param.find( item => item.tabId === currentTabId )?.data ?? []);
  }, [ param, currentTabId ]);

  return (
    <div className="rounded-lg border-[2px] border-[#FAF7F4]">
      <TreeTable
        value={treeData}
        togglerTemplate={togglerTemplate}
        className="text-14 min-h-[320px]"
      >
        <Column
          field="api_key"
          header="KEY"
          expander
          editor={handleTextEditor}
          style={{ height: '50px' }}
          body={( node: TreeNode ) =>
            node.data?.isAddButtonRow ? (
              <div
                className="flex items-center text-14 text-[#868FA0]"
                role="button"
                style={{ marginLeft: marginLeftUnit * node.data.parentCount }}
                onClick={() => !isDisabled && handleAddNode( node )}
              >
                <button
                  type="button"
                  className="border-none p-treetable-toggler p-link"
                  tabIndex={-1}
                >
                  {!isDisabled && <img src={AddIcon} alt="remove" />}
                </button>
                <span className="pl-[2px] italic">
                  {isDisabled ? 'Read-Only Field' : 'Add New Key'}
                </span>
              </div>
            ) : (
              <span className="text-[#171C26] cursor-pointer hover:border-monoid-700">
                {node.data?.api_key}
              </span>
            )
          }
        />
        <Column
          field="value"
          header="VALUE"
          editor={options =>
            !isTreeTable ||
            ( options.node.children && options.node.children.length === 1 ) ? (
              handleTextEditor( options )
            ) : (
              <div className="italic">nested</div>
            )
          }
          body={( node: TreeNode ) => {
            const hasChildren = node.children && node.children.length > 1;
            const value = hasChildren ? 'nested' : node.data?.value;
            const className = hasChildren ? 'italic' : '';

            // return node.data.isAddButtonRow ? (
            //   <button
            //     type="button"
            //     className="h-[42px] -mt-1 -mb-12 w-full"
            //     onClick={() => handleAddNode( node )}
            //   />
            // ) : (
            return <span className={className}>{value}</span>;
            // );
          }}
        />
        <Column
          field="dataType"
          header="TYPE"
          editor={options =>
            ( !isTreeTable && !options.node.data.isAddButtonRow ) ||
            ( options.node.children && options.node.children.length === 1 )
              ? handleDataTypeDropdownEditor( options )
              : null
          }
          body={( node: TreeNode ) => {
            const hasChildren = node.children && node.children.length > 1;
            const value = hasChildren ? '' : node.data?.dataType;
            const className = hasChildren ? 'italic' : '';

            // return node.data.isAddButtonRow ? (
            //   <button
            //     type="button"
            //     className="h-[42px] -mt-1 -mb-12 w-full"
            //     onClick={() => handleAddNode( node )}
            //   />
            // ) : (
            return <span className={`capitalize ${className}`}>{value}</span>;
            // );
          }}
        />
        <Column
          field="description"
          header="DESCRIPTION"
          editor={options =>
            !isTreeTable ||
            ( options.node.children && options.node.children.length === 1 )
              ? handleTextEditor( options )
              : null
          }
          body={( node: TreeNode ) => {
            const hasChildren = node.children && node.children.length > 1;
            const value = hasChildren ? '' : node.data?.description;
            const className = hasChildren ? 'italic' : '';

            // return node.data.isAddButtonRow ? (
            //   <button
            //     type="button"
            //     className="h-[42px] -mt-1 -mb-12 w-full"
            //     onClick={() => handleAddNode( node )}
            //   />
            // ) : (
            return <span className={className}>{value}</span>;
            // );
          }}
        />
        <Column
          field="argumentProvider"
          header="ARGUMENT PROVIDER"
          editor={options =>
            ( !isTreeTable && !options.node.data.isAddButtonRow ) ||
            ( options.node.children && options.node.children.length === 1 )
              ? handleArgumentProviderDropdownEditor( options )
              : null
          }
          body={( node: TreeNode ) => {
            const hasChildren = node.children && node.children.length > 1;
            const value = hasChildren ? '' : node.data?.argumentProvider;
            const className = hasChildren ? 'italic' : '';

            // return node.data.isAddButtonRow ? (
            //   <button
            //     type="button"
            //     className="h-[42px] -mt-1 -mb-12 w-full"
            //     onClick={() => handleAddNode( node )}
            //   />
            // ) : (
            // return <span className={`capitalize ${className}`}>{value}</span>;
            return (
              <span className={`capitalize ${className}`}>
                {startCase(
                  argumentProviderList.find( x => x.value === value )?.label,
                )}
              </span>
            );
          }}
        />
        <Column
          body={isDisabled ? null : actionTemplate}
          className={clsx( isDisabled ? 'w-0' : 'w-[40px]' )}
        />
      </TreeTable>
    </div>
  );
};

export default CustomTreeTable;
