import { Redirect } from 'expo-router';

// Root layout handles real auth-based routing.
// This file simply provides an entry point that redirects
// to the auth screen; the root layout will redirect further
// once the session check completes.
export default function Index() {
  return <Redirect href="/(auth)/sign-in" />;
}
