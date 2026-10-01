import { SafeAreaProvider } from 'react-native-safe-area-context';

import Home from './home';
import Edit from './edit';

import {
  type StaticParamList,
  createStaticNavigation,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const RootStack = createNativeStackNavigator({
  screens: {
    Home: Home,
    Edit: Edit,
  },
  screenOptions: {
    headerShown: false,
  },
});

const Navigation = createStaticNavigation(RootStack);

// React Navigation does not install a SafeAreaProvider of its own, and without one
// useSafeAreaInsets() always reports zero, which puts the button bar under the Android
// navigation bar and the iPhone home indicator.
export default () => (
  <SafeAreaProvider>
    <Navigation />
  </SafeAreaProvider>
);

type RootStackParamList = StaticParamList<typeof RootStack>;

declare global {
  interface RootParamList extends RootStackParamList {}
}
