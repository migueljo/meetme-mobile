import {create} from 'zustand';

export type User = 'bob' | 'alice';
export type UserState = {
  user: User | '';
  callee: User | '';
  setUser: (user: User) => void;
  setCallee: (callee: User) => void;
};

export const useUserStore = create<UserState>(set => ({
  user: '',
  callee: '',
  setUser: user => set({user}),
  setCallee: callee => set({callee}),
}));
