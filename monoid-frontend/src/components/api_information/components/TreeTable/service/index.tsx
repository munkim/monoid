export const NodeService = {
  getTreeTableNodesData() {
    return [
      {
        key: '3',
        data: {
          api_key: 'key_1',
          value: 'long_text_long_text_long_text_long_text_long_text',
          description: 'short description',
          strength: 'Weak',
        },
        children: [
          {
            key: '3-0',
            data: {
              api_key: '',
              value: '',
              description: '',
              strength: '',
              isAddButtonRow: true,
              parentId: '3',
              parentCount: 1,
            },
          },
        ],
      },
      {
        key: '0',
        data: {
          api_key: 'key_2',
          value: 'long_text_long_text_long_text_long_text_long_text',
          description: 'description',
          strength: 'Folder',
        },
        children: [
          {
            key: '0-4',
            data: {
              api_key: '123',
              value: '123456',
              description:
                'long description long description long description long description',
              strength: '345',
            },
            children: [
              {
                key: '0-4-0',
                data: {
                  api_key: '',
                  value: '',
                  description: '',
                  strength: '',
                  isAddButtonRow: true,
                  parentId: '0-4',
                  parentCount: 2,
                },
              },
            ],
          },
          {
            key: '0-0',
            data: {
              api_key: 'ttt',
              value: '435',
              description: '456',
              strength: '345',
            },
            children: [
              {
                key: '0-0-0',
                data: {
                  api_key: 'ttrety',
                  value: 'wq',
                  description: 'tryuk',
                  strength: 'erty',
                },
                children: [
                  {
                    key: '0-0-0-0',
                    data: {
                      api_key: '',
                      value: '',
                      description: '',
                      strength: '',
                      isAddButtonRow: true,
                      parentId: '0-0-0',
                      parentCount: 3,
                    },
                  },
                ],
              },
              {
                key: '0-0-1',
                data: {
                  api_key: '88888888888',
                  value: 'dfg',
                  description: '5t',
                  strength: 'ert',
                },
                children: [
                  {
                    key: '0-0-1-0',
                    data: {
                      api_key: '',
                      value: '',
                      description: '',
                      strength: '',
                      isAddButtonRow: true,
                      parentId: '0-0-1',
                      parentCount: 3,
                    },
                  },
                ],
              },
              {
                key: '0-0-2',
                data: {
                  api_key: '',
                  value: '',
                  description: '',
                  strength: '',
                  isAddButtonRow: true,
                  parentId: '0-0',
                  parentCount: 2,
                },
              },
            ],
          },
          {
            key: '0-1',
            data: {
              api_key: '123',
              value: '123456',
              description: 'short description',
              strength: '345',
            },
            children: [
              {
                key: '0-1-0',
                data: {
                  api_key: '',
                  value: '',
                  description: '',
                  strength: '',
                  isAddButtonRow: true,
                  parentId: '0-1',
                  parentCount: 2,
                },
              },
            ],
          },
          {
            key: '0-2',
            data: {
              api_key: '123',
              value: '123456',
              description: 'short description',
              strength: '345',
            },
            children: [
              {
                key: '0-2-0',
                data: {
                  api_key: '',
                  value: '',
                  description: '',
                  strength: '',
                  isAddButtonRow: true,
                  parentId: '0-2',
                  parentCount: 2,
                },
              },
            ],
          },
          {
            key: '0-3',
            data: {
              api_key: '',
              value: '',
              description: '',
              strength: '',
              isAddButtonRow: true,
              parentId: '0',
              parentCount: 1,
            },
          },
        ],
      },
      {
        key: '1',
        data: {
          api_key: 'key_3',
          value: '111111111111',
          description: 'description',
          strength: 'Folder',
        },
        children: [
          {
            key: '1-0',
            data: {
              api_key: '8989',
              value: '20kb',
              description: 'description',
              strength: 'Folder',
            },
            children: [
              {
                key: '1-0-1',
                data: {
                  api_key: 'yyy',
                  value: 'yyy',
                  description: 'yyy',
                  strength: 'yyy',
                },
                children: [
                  {
                    key: '1-0-1-0',
                    data: {
                      api_key: '',
                      value: '',
                      description: '',
                      strength: '',
                      isAddButtonRow: true,
                      parentId: '1-0-1',
                      parentCount: 3,
                    },
                  },
                ],
              },
              {
                key: '1-0-2',
                data: {
                  api_key: '',
                  value: '',
                  description: '',
                  strength: '',
                  isAddButtonRow: true,
                  parentId: '1-0',
                  parentCount: 2,
                },
              },
            ],
          },
          {
            key: '1-1',
            data: {
              api_key: 'sdf',
              value: '20kb',
              description: 'description',
              strength: 'Folder',
            },
            children: [
              {
                key: '1-1-0',
                data: {
                  api_key: '',
                  value: '',
                  description: '',
                  strength: '',
                  isAddButtonRow: true,
                  parentId: '1-1',
                  parentCount: 2,
                },
              },
            ],
          },
          {
            key: '1-2',
            data: {
              api_key: '',
              value: '',
              description: '',
              strength: '',
              isAddButtonRow: true,
              parentId: '1',
              parentCount: 1,
            },
          },
        ],
      },
      {
        key: '2',
        data: {
          api_key: '',
          value: '',
          description: '',
          strength: '',
          isAddButtonRow: true,
          parentId: undefined,
          parentCount: 0,
        },
      },
    ];
  },

  getTreeTableNodes() {
    return Promise.resolve( this.getTreeTableNodesData());
  },
};
