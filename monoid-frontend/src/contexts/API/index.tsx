import { Dispatch, SetStateAction, createContext } from 'react';
import { v4 } from 'uuid';
import { TreeNode } from 'primereact/treenode';

export type TParam = {
  tabId: string;
  data: TreeNode[];
};

const initialNode: TreeNode[] = [
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

export const initialState: TParam[] = [
  {
    tabId: 'headers',
    data: initialNode,
  },
  {
    tabId: 'query-params',
    data: initialNode,
  },
  {
    tabId: 'path-params',
    data: initialNode,
  },
  {
    tabId: 'body',
    data: initialNode,
  },
];

export type TAPIContext = {
  param: TParam[];
  setParam: Dispatch<SetStateAction<TParam[]>>;
};

const APIContext = createContext<TAPIContext>({
  param: initialState,
  setParam: () => {},
});

export default APIContext;
