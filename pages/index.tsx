import { useRouter } from "next/router";
import { Geist } from "next/font/google";
import { FaMicrophone } from "react-icons/fa";
import { useState } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default function Home() {
  const router = useRouter(); // Use Next.js router for navigation
  const [textSize, setTextSize] = useState(16);

  // Function to handle navigation
  interface NavigateToProps {
    path: string;
  }

  const navigateTo = (path: NavigateToProps["path"]): void => {
    router.push(`/${path}`);
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-6 bg-white ${geistSans.variable}`}>
      
      {/* Stacked Buttons with Navigation */}
      <div className="space-y-6 flex flex-col items-center">
        {[
          { label: "Recipes", path: "recipes" },
          { label: "Shopping List", path: "shoppingList" },
          { label: "Settings", path: "settings" },
        ].map(({ label, path }) => (
          <button
            key={label}
            onClick={() => navigateTo(path)}
            className="bg-black text-white text-2xl font-semibold px-10 py-4 rounded-full shadow-lg w-64"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Microphone Button */}
      <div className="mt-10">
        <button className="bg-blue-500 p-4 rounded-full shadow-lg">
          <FaMicrophone className="text-white text-3xl" />
        </button>
      </div>

      {/* Text Size Selector */}
      <div className="mt-10 w-full max-w-md">
        <p className="text-center text-black font-medium">Text Size Selector</p>
        <input
          type="range"
          min="12"
          max="32"
          value={textSize}
          onChange={(e) => setTextSize(Number(e.target.value))}
          className="w-full mt-2 accent-purple-500"
        />
      </div>
    </div>
  );
}