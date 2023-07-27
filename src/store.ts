import {create} from 'zustand';

export type User = 'bob' | 'alice';
export type UserState = {
  user: User;
  setUser: (user: User) => void;
};

export const useUserStore = create<UserState>(set => ({
  user: 'bob',
  setUser: user => set({user}),
}));
