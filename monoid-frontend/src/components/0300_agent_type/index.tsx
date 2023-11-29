import { FC } from 'react';
import clsx from 'clsx';
import Card from '../0200_card';
import Pill from '../0100_pill';

interface IProps {
  agentType?: string;
  className?: string;
}

const AgentType: FC<IProps> = ({ agentType, className }) => (
  <div className={clsx( 'mb-8', className )}>
    <div className="font-bold mb-2 text-2xl border-b">
      Agent Type
    </div>
    <div>Select how your agent will approach a problem.</div>
    <Card
      className="h-auto mt-2"
      variant={agentType === 'ReAct Agent' ? 'whiteWithBorder' : undefined}
    >
      <div className="text-xl flex font-bold my-2">ReAct Agent</div>
      <div className="flex text-left my-4">
        Agent that reacts to the current state of the world and takes the best
        action it can. It is often used for simple tasks, such as answering
        questions or completing requests. This agent tend to be cheaper and
        faster than Plan-and-Execute Agent.
      </div>
    </Card>
    <Card disabled className="h-auto mt-2 text-monoid-900/25">
      <div className="text-xl flex flex-wrap items-center font-bold my-2">
        <div className="pr-2">Plan and Execute Agent</div>
        <Pill variant="dark">Coming Soon</Pill>
      </div>
      <div className="flex text-left my-4">
        Agent that plans a sequence of actions before taking any action. It is
        often used for executing more complex tasks. This agent tends to be more
        reliable than ReAct Agent.
      </div>
    </Card>
  </div>
);

export default AgentType;
