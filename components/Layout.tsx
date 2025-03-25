// components/Layout.tsx
import React, { FC } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  textSize: number;
  setTextSize: (newSize: number) => void;
}

const Layout: FC<LayoutProps> = ({ children, textSize, setTextSize }) => {
  return (
    <div style={{ fontSize: `${textSize}px` }}>
      {/* Example header or nav */}
      <header className="p-4 bg-gray-100 border-b">
        <h1>My App</h1>
      </header>

      {/* Range input for changing text size */}
      <div className="mt-4 w-full max-w-md mx-auto">
        <label className="block text-center">Text Size</label>
        <input
          type="range"
          min="12"
          max="32"
          value={textSize}
          onChange={(e) => setTextSize(Number(e.target.value))}
          className="w-full mt-2"
        />
        <div className="text-center mt-2">
          Current: {textSize}px
        </div>
      </div>

      {/* Main content */}
      <main className="p-4">
        {children}
      </main>

      {/* Example footer */}
      <footer className="p-4 bg-gray-100 border-t">
        <p>Footer content</p>
      </footer>
    </div>
  );
};

export default Layout;
