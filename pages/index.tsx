import { useRouter } from 'next/router';
import { Geist } from 'next/font/google';
import { FaMicrophone } from 'react-icons/fa';
import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export default function Home() {
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const [textSize, setTextSize] = useState(16);

  // Navigate to the specified path
  const navigateTo = (path: string) => {
    router.push(`/${path}`);
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await supabaseClient.auth.signOut();
      router.push('/signin'); // or wherever you want to redirect
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <div
      // Apply textSize to everything
      style={{ fontSize: `${textSize}px` }}
      className={`flex flex-col items-center justify-center min-h-screen p-6 bg-white ${geistSans.variable}`}
    >
      {/* Navigation buttons */}
      <div className="space-y-6 flex flex-col items-center">
        {[
          { label: 'Recipes', path: 'recipes' },
          { label: 'Shopping List', path: 'shoppingList' },
          { label: 'Settings', path: 'settings' },
        ].map(({ label, path }) => (
          <button
            key={label}
            onClick={() => navigateTo(path)}
            className="bg-black text-white font-semibold px-10 py-4 rounded-full shadow-lg w-64"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Microphone Button */}
      <div className="mt-10">
        <button className="bg-blue-500 p-4 rounded-full shadow-lg">
          {/* Remove fixed text-3xl so icon scales with parent font-size */}
          <FaMicrophone className="text-white" />
        </button>
      </div>

      {/* Text Size Selector */}
      <div className="mt-10 w-full max-w-md">
        <p className="text-center text-black font-medium mb-2">Text Size Selector</p>
        <input
          type="range"
          min="12"
          max="32"
          value={textSize}
          onChange={(e) => setTextSize(Number(e.target.value))}
          className="w-full accent-purple-500"
        />
      </div>

      {/* Sign Out Button */}
      <div className="mt-10">
        <button
          onClick={handleSignOut}
          className="bg-red-600 text-white px-6 py-3 rounded-full shadow-lg"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
