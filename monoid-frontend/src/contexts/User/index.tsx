import { Dispatch, ReactNode, SetStateAction, createContext } from 'react';

export type TModal = {
  title: string;
  children: string | ReactNode;
  type: 'success' | 'error';
};

export type TUser = {
  activeModal: TModal | null;
  sessionToken: string;
  firstName: string;
  lastName: string;
  email: string;
  subdomain: string;
};

export const initialState: TUser = {
  activeModal: null,
  sessionToken: '',
  firstName: '',
  lastName: '',
  email: '',
  subdomain: '',
};

export type TUserContext = {
  user: TUser;
  setUser: Dispatch<SetStateAction<TUser>>;
};

const UserContext = createContext<TUserContext>({
  user: initialState,
  setUser: () => {},
});

export default UserContext;
