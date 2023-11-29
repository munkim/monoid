import { FC } from 'react';
import { Route, Routes } from 'react-router-dom';
import AgentSidebar from 'src/components/0200_agent_sidebar';

const SidebarSocket: FC = () => (
  <Routes>
    <Route path="/agents">
      <Route path="new" />
      <Route path=":id">
        <Route index path="*" element={<AgentSidebar />} />
      </Route>
    </Route>
  </Routes>
);

export default SidebarSocket;
