import {
  TActionForUpstream,
  TActionWithConfigurableParameters,
} from './actions';

type TProject = {
  name: string;
  description: string;
  slug: string;
  url: string;
  agent_type: string;
  is_public: boolean;
  actions: TActionForUpstream[];
  llmOption: string;
  llmApiKey: string;
};

type TProjectWithId = TProject & { id: number };

export type TProjectCreationResponse = TProjectWithId;
export type TProjectCreationPayload = TProject;
export type TProjectUpdateResponse = TProjectWithId;
export type TProjectUpdatePayload = TProjectWithId;
export type TProjectReadResponse = TProjectWithId;
export type TProjectReadPayload = { id: number };
export type TProjectDeletePayload = { id: number };
export type TProjectDeleteResponse = { status: boolean; message: string };
export type TIndexProjectsResponse = TProjectWithId[];

export type TProjectInternal = {
  id: number;
  name: string;
  description: string;
  slug: string;
  agentType: string;
  isPublic: boolean;
  actions: TActionWithConfigurableParameters[];
  schedulerInterval: 'daily' | 'weekly';
  schedulerStartTime: Date | null;
  schedulerPrompt: string;
};
