import { useRouter } from "next/router";
import { useShoppingCart } from "@/context/ShoppingCartContext";
import { useState } from "react";

export default function ShoppingList() {
  const router = useRouter();
  const { cart, clearCart } = useShoppingCart();
  const [searchUrls, setSearchUrls] = useState<string[]>([]);
  const [status, setStatus] = useState("");

  const orderGroceries = () => {
    if (cart.length === 0) {
      setStatus("Your cart is empty.");
      setSearchUrls([]);
      return;
    }

    const baseUrl = "https://www.instacart.com/store/s?k=";
    const urls = cart
      .filter((item) => typeof item === "string" && item.trim() !== "")
      .map((item) => `${baseUrl}${encodeURIComponent(item.trim())}`);
    setSearchUrls(urls);

    setStatus("Click on an item below to search in Instacart:");
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-6">
      {/* Shopping Cart Header */}
      <div className="bg-black text-white text-2xl font-bold px-6 py-3 rounded-md w-full max-w-md text-center shadow-md">
        Your Shopping Cart
      </div>

      {/* Shopping List Items */}
      <div className="w-full max-w-md mt-6 space-y-4">
        {cart.length > 0 ? (
          cart.map((item, index) => (
            <div
              key={index}
              className="bg-white text-gray-800 text-lg px-4 py-3 rounded-md shadow-sm flex items-center justify-center"
            >
              {item}
            </div>
          ))
        ) : (
          <div className="bg-white text-gray-500 text-lg px-4 py-3 rounded-md shadow-sm text-center">
            No items in your cart.
          </div>
        )}
      </div>

      {/* Order Groceries Button (Green) */}
      <button
        onClick={orderGroceries}
        className="mt-8 bg-green-600 text-white text-lg font-semibold px-6 py-3 rounded-md shadow-md w-full max-w-md 
                   hover:bg-green-700 transition-colors duration-200"
      >
        Order Groceries
      </button>

      {/* Show Status */}
      {status && (
        <div className="mt-6 text-center text-gray-700 font-medium w-full max-w-md">
          {status}
        </div>
      )}

      {/* Show Instacart Links */}
      {searchUrls.length > 0 && (
        <div className="mt-4 w-full max-w-md space-y-2">
          {searchUrls.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white text-blue-600 font-medium underline px-4 py-2 rounded-md shadow-sm hover:bg-gray-100 transition"
            >
              🔍 Search for "{decodeURIComponent(url.split("k=")[1] || "Item")}"
            </a>
          ))}
        </div>
      )}

      {/* Clear Cart Button */}
      {cart.length > 0 && (
        <button
          onClick={() => {
            clearCart();
            setSearchUrls([]);
            setStatus("");
          }}
          className="mt-4 bg-red-500 text-white text-lg font-semibold px-6 py-3 rounded-md shadow-md w-full max-w-md 
                     hover:bg-red-600 transition-colors duration-200"
        >
          Clear Cart
        </button>
      )}

      {/* Back to Home Button (Blue) */}
      <button
        onClick={() => router.push("/")}
        className="mt-4 bg-blue-600 text-white text-lg font-semibold px-6 py-3 rounded-md shadow-md w-full max-w-md 
                   hover:bg-blue-700 transition-colors duration-200"
      >
        Back to Home
      </button>
    </div>
  );
}
