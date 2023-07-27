export type RootStackParamList = {
  ChooseUser: undefined;
  Call: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
