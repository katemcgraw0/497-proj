import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';

export default function SignIn() {
  const router = useRouter();
  const session = useSession();
  const supabaseClient = useSupabaseClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between sign-in & sign-up
  const [errorMessage, setErrorMessage] = useState('');

  // Log session info for debugging
  useEffect(() => {
    console.log('Session from useSession():', session);
    if (session) {
      console.log('User is already logged in:', session.user);
      router.push('/');
    }
  }, [session, router]);

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    console.log('Form submit triggered. isSignUp =', isSignUp);
    console.log('Attempting auth with email:', email);

    try {
      if (isSignUp) {
        console.log('--- Signing Up ---');
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
        });
        console.log('Sign-up response data:', data);

        if (error) {
          console.error('Sign-up error:', error);
          throw error;
        } else {
          console.log('No sign-up error. Data:', data);
        }
      } else {
        console.log('--- Signing In ---');
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });
        console.log('Sign-in response data:', data);

        if (error) {
          console.error('Sign-in error:', error);
          throw error;
        } else {
          console.log('No sign-in error. Data:', data);
        }
      }

      // On success, supabase will set a session.
      console.log('Auth attempt successful. Navigating to /');
      router.push('/');
    } catch (err: any) {
      console.error('Caught auth error:', err);
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold">
          {isSignUp ? 'Create an Account' : 'Sign In'}
        </h1>
        {errorMessage && (
          <div className="mb-4 rounded bg-red-100 p-3 text-red-700">
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleFormSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              className="w-full rounded border px-3 py-2"
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              className="w-full rounded border px-3 py-2"
              type="password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700"
          >
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
        <div className="mt-4 text-center">
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => setIsSignUp(false)}
                className="font-semibold text-blue-600 hover:underline"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don&rsquo;t have an account?{' '}
              <button
                onClick={() => setIsSignUp(true)}
                className="font-semibold text-blue-600 hover:underline"
              >
                Sign Up
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
