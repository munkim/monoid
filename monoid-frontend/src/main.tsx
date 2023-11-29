import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Root from './routes/Root';

import './index.css';
import 'react-toggle/style.css';
import 'react-datepicker/dist/react-datepicker.css';
import './css/react-datepicker.scss';
import Chat from './routes/Chat';
import AuthenticationLayer from './routes/AuthenticationLayer';
import AgentBasicSocket from './sockets/AgentBasicSocket';
import AgentConfigSocket from './sockets/AgentConfigSocket';
import MonoidHub from './sockets/MonoidHub';
import Agent from './routes/Agent';
import ActionEditorSocket from './sockets/ActionEditorSocket';
import ApiAccessSocket from './sockets/ApiAccessSocket';
import MonitoringSocket from './sockets/MonitoringSocket';
import ConversationManagerSocket from './sockets/ConversationManagerSocket';
import EmailAllowlist from './routes/EmailWhitelist';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Root />}>
      <Route element={<AuthenticationLayer />}>
        <Route path="/" element={<MonoidHub />} />
        <Route path="/agents">
          <Route index element={<MonoidHub />} />
          <Route path="new" element={<AgentBasicSocket />} />
          <Route path=":id" element={<Agent />}>
            <Route index element={<AgentConfigSocket />} />
            <Route path="config" element={<AgentConfigSocket />} />
            <Route path="actions">
              <Route index element={<MonoidHub />} />
              <Route path="new" element={<ActionEditorSocket />} />
            </Route>
            <Route path="api_access" element={<ApiAccessSocket />} />
            <Route path="monitoring" element={<MonitoringSocket />} />
            <Route
              path="conversation_manager"
              element={<ConversationManagerSocket />}
            />
          </Route>
        </Route>
        {/* <Route path="/action_hub" element={<MonoidHub />} /> */}
        <Route path="/actions">
          <Route path=":actionId" element={<ActionEditorSocket />} />
        </Route>
        <Route path="/admin">
          <Route path="email_allowlist" element={<EmailAllowlist />} />
        </Route>
      </Route>
      <Route path="/chat" element={<Chat />}>
        <Route index />
        <Route path=":id">
          <Route path=":sessionId" />
        </Route>
      </Route>
    </Route>,
  ),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot( document.getElementById( 'root' ) as HTMLElement ).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider
        clientId={import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID}
      >
        <RouterProvider router={router} />
      </GoogleOAuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
