import { FC } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { faDiagramProject } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'src/components/0100_button';

const RightHeaderTitle: FC = () => (
  <Routes>
    <Route path="/">
      <Route
        path="action_hub"
        element={
          <Button variant="invert" className="mr-2">
            <Link to="/">My Agents</Link>
          </Button>
        }
      />
      <Route path="agents">
        <Route
          path="*"
          element={
            <Button variant="invert" className="mr-2">
              <Link to="/action_hub" className="hidden md:block">
                Action Hub
              </Link>
              <Link to="/action_hub" className="md:hidden">
                <FontAwesomeIcon icon={faDiagramProject} />
              </Link>
            </Button>
          }
        />
      </Route>
      <Route
        index
        element={
          <Button variant="invert" className="mr-2">
            <Link to="/action_hub" className="hidden md:block">
              Action Hub
            </Link>
            <Link to="/action_hub" className="md:hidden">
              <FontAwesomeIcon icon={faDiagramProject} />
            </Link>
          </Button>
        }
      />
    </Route>
  </Routes>
);

export default RightHeaderTitle;
