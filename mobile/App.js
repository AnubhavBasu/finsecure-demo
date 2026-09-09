import { useCallback, useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, SourceSerif4_500Medium, SourceSerif4_600SemiBold } from '@expo-google-fonts/source-serif-4';
import { IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';

import SignUpScreen from './screens/SignUpScreen';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import TransferScreen from './screens/TransferScreen';
import { colors, fonts } from './theme';

const Stack = createNativeStackNavigator();

// Header-right logout control, shared by every screen that shows a header
// (Dashboard, Transfer). Login and SignUp set headerShown: false in their
// own `options` and never render this. Mirrors web's AppShell "Log out"
// button: clears stored session state, resets the nav stack to Login so
// the back button can't return to an authenticated screen.
function LogoutButton({ navigation }) {
  const logout = async () => {
    await AsyncStorage.clear();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };
  return (
    <Pressable onPress={logout} accessibilityLabel="Log out" hitSlop={8}>
      <Text style={{ color: colors.white, fontFamily: fonts.bodyMedium, fontSize: 14 }}>Log out</Text>
    </Pressable>
  );
}
// Keep the native splash screen up until fonts are ready — this is the
// current recommended pattern (expo-splash-screen), not the deprecated
// expo-app-loading package still shown in some older docs/examples.
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    SourceSerif4_500Medium,
    SourceSerif4_600SemiBold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // If fonts fail to load (e.g. offline), proceed anyway with system fonts
  // rather than hanging on the splash screen indefinitely.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={({ navigation }) => ({
          headerStyle: { backgroundColor: colors.ink },
          headerTintColor: colors.white,
          headerTitleStyle: { fontFamily: fonts.display, fontSize: 18 },
          headerShadowVisible: false,
          headerRight: () => <LogoutButton navigation={navigation} />,
        })}
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'FinSecure', headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Open account', headerShown: false }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'FinSecure' }} />
        <Stack.Screen name="Transfer" component={TransferScreen} options={{ title: 'Send money' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
