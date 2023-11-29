export const capitalizationLanguageNameMap: Record<string, string> = {
  sql: 'SQL',
  javascript: 'JavaScript',
  java: 'Java',
  typescript: 'TypeScript',
  vbscript: 'VBScript',
  css: 'CSS',
  html: 'HTML',
  xml: 'XML',
  php: 'PHP',
  python: 'Python',
  yaml: 'Yaml',
  mermaid: 'Mermaid',
  markdown: 'MarkDown',
  makefile: 'MakeFile',
};

export const httpMethodListMap: {
  label?: string;
  value: string;
  className?: string;
}[] = [
  {
    label: 'GET',
    value: 'GET',
    className: 'font-bold text-green-500',
  },
  {
    label: 'POST',
    value: 'POST',
    className: 'font-bold text-orange-500',
  },
  {
    label: 'PUT',
    value: 'PUT',
    className: 'font-bold text-cyan-500',
  },
  {
    label: 'DELETE',
    value: 'DELETE',
    className: 'font-bold text-red-500',
  },
];

export const parameterList: {
  id: string;
  label: string;
  content?: string;
  isTreeTable?: boolean;
}[] = [
  {
    id: 'headers',
    label: 'Headers',
    content: 'Content of Tab 1',
    isTreeTable: false,
  },
  {
    id: 'query-params',
    label: 'Query Param',
    content: 'Content of Tab 2',
    isTreeTable: false,
  },
  {
    id: 'path-params',
    label: 'Path Param',
    content: 'Content of Tab 3',
    isTreeTable: false,
  },
  { id: 'body', label: 'Body', content: 'Content of Tab 4', isTreeTable: true },
];

export const tabList: { id: number; label: string }[] = [
  { id: 1, label: 'Response' },
  { id: 2, label: 'Request' },
];

export const dataTypeList: { label?: string; value: string }[] = [
  {
    label: 'String',
    value: 'string',
  },
  {
    label: 'Number',
    value: 'number',
  },
  {
    label: 'Boolean',
    value: 'boolean',
  },
];

export const argumentProviderList: { label?: string; value: string }[] = [
  {
    label: 'Agent',
    value: 'agent',
  },
  {
    label: 'Action Creator',
    value: 'creator',
  },
  {
    label: 'Agent Creator',
    value: 'user',
  },
];
