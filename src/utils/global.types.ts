export type RootStackParamList = {
  ChooseUser: undefined;
  Call: undefined;
  CallRoom: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
