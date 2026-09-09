# App Patches for Full Kane-CLI Checkpoint Coverage — Final, Verified

Every diff below is checked against the actual source pulled from
`AnubhavBasu/finsecure-demo` on 2026-09-09 (backend/routes/*.js, backend/server.js,
backend/package.json, web/src/App.jsx, web/src/api.js, web/src/main.jsx,
web/src/pages/*.jsx, web/src/components/AppShell.jsx, web/index.html,
web/package.json). Mobile source was not pulled — see the note at the bottom.

Original Patch 06 (URL routing) is **cancelled** — `web/src/App.jsx` already
uses clean `react-router-dom` routes with no hash routing. Nothing to change.

---

## Patch 01 — Session Cookie + CORS Credentials

**File: `backend/routes/auth.js`** — end of the `POST /api/auth/verify-otp` handler

Before:
```javascript
  // Demo-only "session": a token that just encodes the account id.
  // Not a real auth token — do not reuse this pattern outside a demo.
  const token = `demo-token-${result.payload.accountId}`;
  return res.json({ token, accountId: result.payload.accountId });
});
```

After:
```javascript
  // Demo-only "session": a token that just encodes the account id.
  // Not a real auth token — do not reuse this pattern outside a demo.
  const token = `demo-token-${result.payload.accountId}`;

  // Demo-only session cookie, mirroring the token already returned in the body.
  res.cookie('session_id', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 60 * 1000, // 30 minutes
  });

  return res.json({ token, accountId: result.payload.accountId });
});
```

**File: `backend/server.js`**

Before:
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const transferRoutes = require('./routes/transfers');

const app = express();
app.use(cors()); // demo only — allow the local web app and the Expo dev client
app.use(express.json());
```

After:
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const transferRoutes = require('./routes/transfers');

const app = express();
app.use(cors({
  origin: 'http://localhost:5173', // demo only — the local web app
  credentials: true, // required so the browser stores/sends the session_id cookie
}));
app.use(express.json());
app.use(cookieParser());
```

**File: `backend/package.json`**

```diff
   "dependencies": {
     "bcryptjs": "^2.4.3",
+    "cookie-parser": "^1.4.6",
     "cors": "^2.8.5",
     "dotenv": "^16.4.5",
     "express": "^4.19.2",
     "mysql2": "^3.11.0"
   }
```

**File: `web/src/api.js`** — required so the cookie survives the cross-origin (5173 → 4000) request; without this the browser silently drops the `Set-Cookie` header and Patch 01 has no visible effect.

Before:
```javascript
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
```

After:
```javascript
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // send/receive the session_id cookie across origins
    ...options,
  });
```

Run `npm install` in `backend/` after this patch to pull in `cookie-parser`.

**Why:** Enables DevTools: Cookies checkpoint.

---

## Patch 02 — localStorage `user_prefs`

**File: `web/src/pages/Login.jsx`**

The app already stores `token` and `accountId` in `localStorage` on successful
OTP verify — this was NOT missing, contrary to the original patch draft. Only
the `user_prefs` key is new (also folds in the Patch 03 console line below).

Before:
```javascript
  const submitOtp = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const result = await api.verifyLoginOtp({ challengeId, otp });
      localStorage.setItem('token', result.token);
      localStorage.setItem('accountId', result.accountId);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };
```

After:
```javascript
  const submitOtp = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const result = await api.verifyLoginOtp({ challengeId, otp });
      localStorage.setItem('token', result.token);
      localStorage.setItem('accountId', result.accountId);
      localStorage.setItem('user_prefs', JSON.stringify({ theme: 'light', notifications: true }));
      console.log('FS_EVENT: login_success', { accountId: result.accountId, timestamp: Date.now() });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };
```

**Why:** Enables DevTools: localStorage checkpoint (key existence + JSON value drilling).

---

## Patch 03 — Console Instrumentation

**File: `web/src/pages/Login.jsx`** — `submitPassword` handler's catch block

Before:
```javascript
  const submitPassword = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const result = await api.login({ email, password });
      setChallengeId(result.challengeId);
      setStep('otp');
    } catch (err) {
      setError(err.message);
    }
  };
```

After:
```javascript
  const submitPassword = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const result = await api.login({ email, password });
      setChallengeId(result.challengeId);
      setStep('otp');
    } catch (err) {
      console.error('FS_EVENT: login_failed', { email, reason: err.message });
      setError(err.message);
    }
  };
```

**File: `web/src/pages/Transfer.jsx`** — `submitTransfer` handler

Before:
```javascript
  const submitTransfer = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const result = await api.transfer({ accountId, toPayee, amount: Number(amount) });
      if (result.requiresOtp) {
        setChallengeId(result.challengeId);
        setMessage(result.message);
      } else {
        setMessage(`Transfer of $${result.amount} to ${result.toPayee} completed.`);
      }
    } catch (err) {
      setError(err.message);
    }
  };
```

After:
```javascript
  const submitTransfer = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    console.log('FS_EVENT: transfer_initiated', { toPayee, amount: Number(amount) });
    try {
      const result = await api.transfer({ accountId, toPayee, amount: Number(amount) });
      if (result.requiresOtp) {
        setChallengeId(result.challengeId);
        setMessage(result.message);
      } else {
        console.log('FS_EVENT: transfer_completed', { toPayee: result.toPayee, amount: result.amount });
        setMessage(`Transfer of $${result.amount} to ${result.toPayee} completed.`);
      }
    } catch (err) {
      console.error('FS_EVENT: transfer_failed', { toPayee, amount, reason: err.message });
      setError(err.message);
    }
  };
```

Also update `submitOtp` in the same file — add a log line after the success message is set:

Before:
```javascript
  const submitOtp = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const result = await api.verifyTransferOtp({ challengeId, otp });
      setMessage(`Transfer of $${result.amount} to ${result.toPayee} completed.`);
      setChallengeId(null);
    } catch (err) {
      setError(err.message);
    }
  };
```

After:
```javascript
  const submitOtp = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const result = await api.verifyTransferOtp({ challengeId, otp });
      console.log('FS_EVENT: transfer_completed', { toPayee: result.toPayee, amount: result.amount });
      setMessage(`Transfer of $${result.amount} to ${result.toPayee} completed.`);
      setChallengeId(null);
    } catch (err) {
      setError(err.message);
    }
  };
```

**Why:** Enables DevTools: Console checkpoint.

---

## Patch 04 — Page Titles per Route

**File: `web/src/pages/Login.jsx`** — import line + inside the component body

Before (import line):
```javascript
import { useState } from 'react';
```
After:
```javascript
import { useState, useEffect } from 'react';
```

Insert after the last `useState` hook declaration (after `const [error, setError] = useState(null);`, before `submitPassword`):
```javascript
  useEffect(() => { document.title = 'Login — FinSecure'; }, []);
```

**File: `web/src/pages/SignUp.jsx`** — same import fix

Before:
```javascript
import { useState } from 'react';
```
After:
```javascript
import { useState, useEffect } from 'react';
```

Insert after the last `useState` hook (`const [error, setError] = useState(null);`), before `const update = ...`:
```javascript
  useEffect(() => { document.title = 'Sign Up — FinSecure'; }, []);
```

**File: `web/src/pages/Dashboard.jsx`** — already imports `useEffect`; add the title line inside the existing effect

Before:
```javascript
  useEffect(() => {
    const accountId = localStorage.getItem('accountId');
    if (!accountId) {
      navigate('/login');
      return;
    }
    api.getAccount(accountId).then(setAccount).catch((err) => setError(err.message));
  }, [navigate]);
```

After:
```javascript
  useEffect(() => {
    document.title = 'Dashboard — FinSecure';
    const accountId = localStorage.getItem('accountId');
    if (!accountId) {
      navigate('/login');
      return;
    }
    api.getAccount(accountId).then(setAccount).catch((err) => setError(err.message));
  }, [navigate]);
```

**File: `web/src/pages/Transfer.jsx`** — needs `useEffect` added to imports (currently only imports `useState`)

Before:
```javascript
import { useState } from 'react';
```
After:
```javascript
import { useState, useEffect } from 'react';
```

Add near the top of the component body, after the existing `useState` declarations:
```javascript
  useEffect(() => { document.title = 'Transfer — FinSecure'; }, []);
```

**Why:** Enables Title checkpoint. Base `<title>` in `web/index.html` ("FinSecure — Demo Banking") never changes on client-side navigation without this.

---

## Patch 05 — DOM States: `disabled` + `aria-label`

**File: `web/src/pages/Login.jsx`**

Before:
```jsx
            <button type="submit" className="btn btn-primary btn-block">Continue</button>
```

After:
```jsx
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={!email || !password}
              aria-label="Continue to OTP verification"
            >
              Continue
            </button>
```

**File: `web/src/pages/Transfer.jsx`**

Before:
```jsx
            <button type="submit" className="btn btn-primary btn-block">Send</button>
```

After:
```jsx
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={!toPayee || !amount || Number(amount) <= 0}
              aria-label="Submit fund transfer"
            >
              Send
            </button>
```

**Why:** Enables Textual (DOM) checkpoint (assert button is disabled/enabled, assert aria-label).

Note: the real login button says **"Continue"**, not "Login" — there is no
button literally labeled "Login" anywhere in this app. Test files have been
updated to match.

---

## Verification Checklist

| Patch | How to verify |
|-------|---------------|
| 01 | `curl -v -X POST localhost:4000/api/auth/verify-otp -H 'Content-Type: application/json' -d '{"challengeId":"<real-id>","otp":"123456"}'` → check `Set-Cookie` header. Also confirm in browser DevTools → Application → Cookies after a real login through the UI. |
| 02 | Browser DevTools → Application → Local Storage → confirm `user_prefs` key exists alongside the pre-existing `token`/`accountId` after login |
| 03 | Browser DevTools → Console → confirm `FS_EVENT: login_success` / `FS_EVENT: transfer_completed` appear |
| 04 | Browser tab title changes to "Dashboard — FinSecure" after login, "Transfer — FinSecure" on the transfer page |
| 05 | On `/login`, confirm the Continue button is disabled before typing, enabled once both fields have values |

## Patch 07 — Mobile: Disabled Button State (new code, not an oversight in the docs)

Verified against `mobile/components/Button.js`, `mobile/screens/LoginScreen.js`,
`mobile/screens/TransferScreen.js` on 2026-09-09. Unlike the web app,
`Button.js` has no concept of "disabled until required fields are filled" —
it only disables itself while `loading` is true. Neither screen passes a
`disabled` prop. This is a genuine gap in the app, not something Kane-CLI
testing can verify around — if you want a mobile Textual/DOM-equivalent
disabled-state check (see the "Uncertain" note below on whether that even
works for mobile), the app needs this code first.

**File: `mobile/components/Button.js`**

Before:
```javascript
export default function Button({ title, onPress, variant = 'primary', loading = false, style }) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: v.bg, borderColor: v.border, opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={v.text} /> : <Text style={[styles.label, { color: v.text }]}>{title}</Text>}
    </Pressable>
  );
}
```

After:
```javascript
export default function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, style }) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const isDisabled = loading || disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: v.bg, borderColor: v.border, opacity: isDisabled && !loading ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={v.text} /> : <Text style={[styles.label, { color: v.text }]}>{title}</Text>}
    </Pressable>
  );
}
```

**File: `mobile/screens/LoginScreen.js`**

Before:
```javascript
              <Button title="Continue" onPress={submitPassword} loading={loading} />
```

After:
```javascript
              <Button title="Continue" onPress={submitPassword} loading={loading} disabled={!email || !password} />
```

**File: `mobile/screens/TransferScreen.js`**

Before:
```javascript
                <Button title="Send" onPress={submitTransfer} loading={loading} />
```

After:
```javascript
                <Button title="Send" onPress={submitTransfer} loading={loading} disabled={!toPayee || !amount || Number(amount) <= 0} />
```

**Why:** Adds `accessibilityState={{ disabled }}` — the RN equivalent of a
DOM `disabled` attribute — so an automation tool inspecting the
accessibility tree can see the state, matching the intent of web Patch 05.
Whether Kane-CLI's mobile automation actually reads this is unconfirmed
(see below) — this patch makes the state exist; it doesn't guarantee
Kane-CLI can assert on it.

## Verification Checklist (continued)

| Patch | How to verify |
|-------|---------------|
| 07 | On the Android emulator or iOS simulator, open the Login screen — Continue button should visibly dim (opacity 0.5) before typing, return to full opacity once both fields have values. Same for Send on the Transfer screen. |

## Patch 08 — Mobile: Logout Button (real gap found by manual testing, confirmed against source)

Verified against `mobile/App.js`, `mobile/screens/DashboardScreen.js`,
`mobile/screens/TransferScreen.js`, and `mobile/components/BottomNav.js` on
2026-09-09 (re-checked twice — file listing unchanged, raw content
byte-identical to the first pull). **There is no logout mechanism anywhere
in the mobile app** — no button, no header action, no other screen. Web has
one in `AppShell.jsx` (`localStorage.clear(); navigate('/login');` behind a
"Log out" button in the header, shown on every authenticated screen). This
patch adds the mobile equivalent in one place — `App.js`'s shared
`Stack.Navigator` header — so both Dashboard and Transfer get it without
touching either screen file. Login and SignUp never see it, because they
already set `headerShown: false`.

**File: `mobile/App.js`**

Before:
```javascript
import { useCallback, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, SourceSerif4_500Medium, SourceSerif4_600SemiBold } from '@expo-google-fonts/source-serif-4';
import { IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';

import SignUpScreen from './screens/SignUpScreen';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import TransferScreen from './screens/TransferScreen';
import { colors, fonts } from './theme';

const Stack = createNativeStackNavigator();
```

After:
```javascript
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
```

Before:
```javascript
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: colors.ink },
          headerTintColor: colors.white,
          headerTitleStyle: { fontFamily: fonts.display, fontSize: 18 },
          headerShadowVisible: false,
        }}
      >
```

After:
```javascript
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
```

Nothing else in the file changes — the `<Stack.Screen>` declarations and
their individual `options` (`headerShown: false` on Login/SignUp, `title`
on all four) are untouched and still take effect; `headerRight` only fills
in where a header is actually shown.

**Why the `screenOptions` object had to become a function:** React
Navigation only gives you the `navigation` object inside `screenOptions`
when it's a function of `{ navigation, route }` — a plain object (what was
there before) has no way to reach it, so `headerRight` couldn't call
`navigation.reset(...)`. This is a required structural change, not a style
preference.

---

## Patch 09 — Mobile: AsyncStorage `user_prefs` (parity with web Patch 02)

**File: `mobile/screens/LoginScreen.js`**

Before:
```javascript
  const submitOtp = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await api.verifyLoginOtp({ challengeId, otp });
      await AsyncStorage.setItem('token', result.token);
      await AsyncStorage.setItem('accountId', String(result.accountId));
      navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [challengeId, otp, navigation]);
```

After:
```javascript
  const submitOtp = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await api.verifyLoginOtp({ challengeId, otp });
      await AsyncStorage.setItem('token', result.token);
      await AsyncStorage.setItem('accountId', String(result.accountId));
      await AsyncStorage.setItem('user_prefs', JSON.stringify({ theme: 'light', notifications: true }));
      console.log('FS_EVENT: login_success', { accountId: result.accountId, timestamp: Date.now() });
      navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [challengeId, otp, navigation]);
```

---

## Patch 10 — Mobile: Console Instrumentation (parity with web Patch 03)

Whether Kane-CLI's mobile automation captures React Native `console.*`
output the way it captures browser DevTools console output is **unconfirmed**
(see the closing note below) — this patch costs nothing to add and gives
parity if it turns out to be readable, but don't write a test asserting on
it until you've confirmed that with a real run.

**File: `mobile/screens/LoginScreen.js`** — `submitPassword`'s catch block

Before:
```javascript
  const submitPassword = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await api.login({ email, password });
      setChallengeId(result.challengeId);
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [email, password]);
```

After:
```javascript
  const submitPassword = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await api.login({ email, password });
      setChallengeId(result.challengeId);
      setStep('otp');
    } catch (err) {
      console.error('FS_EVENT: login_failed', { email, reason: err.message });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [email, password]);
```

**File: `mobile/screens/TransferScreen.js`**

Before:
```javascript
  const submitTransfer = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const accountId = await AsyncStorage.getItem('accountId');
      const result = await api.transfer({ accountId, toPayee, amount: Number(amount) });
      if (result.requiresOtp) {
        setChallengeId(result.challengeId);
        setMessage(result.message);
      } else {
        setMessage(`Transfer of $${result.amount} to ${result.toPayee} completed.`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await api.verifyTransferOtp({ challengeId, otp });
      setMessage(`Transfer of $${result.amount} to ${result.toPayee} completed.`);
      setChallengeId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
```

After:
```javascript
  const submitTransfer = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    console.log('FS_EVENT: transfer_initiated', { toPayee, amount: Number(amount) });
    try {
      const accountId = await AsyncStorage.getItem('accountId');
      const result = await api.transfer({ accountId, toPayee, amount: Number(amount) });
      if (result.requiresOtp) {
        setChallengeId(result.challengeId);
        setMessage(result.message);
      } else {
        console.log('FS_EVENT: transfer_completed', { toPayee: result.toPayee, amount: result.amount });
        setMessage(`Transfer of $${result.amount} to ${result.toPayee} completed.`);
      }
    } catch (err) {
      console.error('FS_EVENT: transfer_failed', { toPayee, amount, reason: err.message });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await api.verifyTransferOtp({ challengeId, otp });
      console.log('FS_EVENT: transfer_completed', { toPayee: result.toPayee, amount: result.amount });
      setMessage(`Transfer of $${result.amount} to ${result.toPayee} completed.`);
      setChallengeId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
```

---

## Patches Not Applicable to Mobile

- **Web Patch 01 (session cookie)** — no equivalent. Cookies are an
  HTTP/browser concept; a native app's `fetch()` isn't a browser session
  and has no cookie jar Kane-CLI's DevTools-style checkpoint could read.
  Nothing to patch here.
- **Web Patch 06 (URL routing, cancelled on web too)** — no equivalent.
  React Navigation stack screens have names, not URLs.
- **Title checkpoint** — no direct equivalent either. React Navigation's
  per-screen `title` option (already present: "FinSecure" on Dashboard,
  "Send money" on Transfer) governs the native header bar text, which is a
  different mechanism from a web `document.title`, and only visible when
  `headerShown` is true. No patch needed — it already does something
  useful, it's just not the same checkpoint type.

## Verification Checklist (continued)

| Patch | How to verify |
|-------|---------------|
| 07 | On the Android emulator or iOS simulator, open the Login screen — Continue button should visibly dim (opacity 0.5) before typing, return to full opacity once both fields have values. Same for Send on the Transfer screen. |
| 08 | On Dashboard or Transfer, confirm a "Log out" control appears in the top-right of the header. Tap it — should return to the Login screen, and confirm via a subsequent app restart or a manual AsyncStorage check that `token`/`accountId`/`user_prefs` are gone. |
| 09 | After a fresh login, check AsyncStorage (via Expo dev tools or a debug log) for a `user_prefs` key alongside `token`/`accountId`. |
| 10 | With the Metro bundler / Expo dev tools console open, confirm `FS_EVENT: login_success` etc. appear on the corresponding actions. |

## Uncertain — Whether Kane-CLI Mobile Testing Reads Mobile Checkpoints the Same Way

`kane-cli-mobile.md` describes mobile objectives as screen text and control
assertions ("Objectives are written the same way... describes app screens
and controls"), but does not confirm that Network, Console, Cookies, or
AsyncStorage-equivalent checkpoints work against a mobile app the way
DevTools checkpoints work against a browser page. Treat mobile Kane-CLI
tests as Visual-checkpoint-only (`assert the screen contains ...`,
`assert the <label> field...`) until proven otherwise with a real run. Do
not write a mobile test asserting on AsyncStorage contents or console
output without checking this first — those checkpoints are documented for
the browser/DevTools stack specifically.
