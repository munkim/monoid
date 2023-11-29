import { FC } from 'react';
import { faDiagramProject } from '@fortawesome/free-solid-svg-icons';
import { Routes, Route } from 'react-router-dom';
import PageTitleText from 'src/components/0100_page_title_text';
import PageTitleResponsiveText from 'src/components/0100_page_title_responsive_text';
import ActionTitle from './ActionTitle';
import AgentTitle from './AgentTitle';

const LeftHeaderTitle: FC = () => (
  <Routes>
    <Route path="/" element={<PageTitleText includeOutlet to="/" label="" />}>
      <Route path="agents">
        <Route
          path="new"
          element={<PageTitleText label="Create New Agent" />}
        />
        <Route path=":id">
          <Route index element={<AgentTitle />} />
          <Route path="*" element={<AgentTitle />} />
          <Route path="actions" element={<AgentTitle />}>
            <Route index path="*" element={<PageTitleText label="Actions" />} />
            <Route path="new" element={<PageTitleText label="New Action" />} />
          </Route>
        </Route>
      </Route>
    </Route>
    <Route
      path="/action_hub"
      element={
        <PageTitleResponsiveText
          to="/action_hub"
          label="Action Hub"
          icon={faDiagramProject}
        />
      }
    />
    <Route
      path="/actions"
      element={
        <PageTitleResponsiveText
          to="/action_hub"
          label=""
          icon={faDiagramProject}
        />
      }
    >
      <Route path="new" element={<PageTitleText label="Create New Action" />} />
      <Route path=":id" element={<ActionTitle />}>
        <Route path="*" element={<ActionTitle />} />
      </Route>
    </Route>
  </Routes>
);

export default LeftHeaderTitle;
