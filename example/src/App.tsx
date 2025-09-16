import Home from './home';
import Edit from './edit';

import { type StaticParamList, createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const RootStack = createNativeStackNavigator({
  screens: {
    Home: Home,
    Edit: Edit
  },
  screenOptions: {
    headerShown: false
  }
});

const Navigation = createStaticNavigation(RootStack);

export default () => <Navigation/>;

type RootStackParamList = StaticParamList<typeof RootStack>;

declare global {
  interface RootParamList extends RootStackParamList {}
}
