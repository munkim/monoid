type TActionCall = {
  type: 'action_call';
  content: {
    name: string;
    arguments: string;
    action_type: string;
  };
  agent_name: string;
  nesting_level: number;
};

export type TApiResponse = {
  type: 'api_response';
  content: {
    name: string;
    body: Record<string, unknown>;
    method: string;
    query_parameters: Record<string, unknown>;
    response: Record<string, unknown>;
    status_code: number;
    time_elapsed: number;
    url: string;
  };
  agent_name: string;
  nesting_level: number;
};

type TLanguageResponse = {
  type: 'language_response';
  content: string;
  agent_name?: string;
  nesting_level: number;
};

type TExpertAgentLanguageResponse = {
  type: 'expert_agent_language_response';
  content: string;
  agent_name?: string;
  nesting_level: number;
};

type TTimeElapsed = {
  type: 'time_elapsed';
  content: number;
  agent_name?: string;
  nesting_level: number;
};

type TExpertAgentCallStart = {
  type: 'expert_agent_call_start';
  content: {
    expert_agent_name: string;
    expert_agent_id: number;
  };
  agent_name: string;
  nesting_level: number;
};

type TExpertAgentCallEnd = {
  type: 'expert_agent_call_finish';
  content: {
    expert_agent_name: string;
    expert_agent_id: number;
  };
  agent_name: string;
  nesting_level: number;
};

type TStop = {
  type: 'stop';
  last_response_type: string;
  agent_name?: string;
  nesting_level: number;
};


export type TAnnotatedActionCall =
  | TActionCall
  | TApiResponse
  | TLanguageResponse
  | TExpertAgentLanguageResponse
  | TTimeElapsed
  | TExpertAgentCallStart
  | TExpertAgentCallEnd
  | TStop;
