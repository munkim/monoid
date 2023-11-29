from enum import Enum

class AgentType(str, Enum):
    ReActAgent = 'ReAct Agent'
    PlanAndExecuteAgent = 'Plan And Execute Agent'
