import { useRouter } from "next/router";
import { useShoppingCart } from "@/context/ShoppingCartContext";

export default function ShoppingList() {
  const router = useRouter();
  const { cart, clearCart } = useShoppingCart();

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      {/* Shopping Cart Header */}
      <div className="bg-black text-white text-lg font-semibold px-6 py-3 rounded-lg w-full max-w-sm text-center mb-4">
        Your Shopping Cart
      </div>

      {/* Shopping List Items */}
      <div className="space-y-3 w-full max-w-sm">
        {cart.length > 0 ? (
          cart.map((item, index) => (
            <div key={index} className="bg-gray-300 text-black text-center px-4 py-2 rounded-lg shadow">
              {item}
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">No items in cart</p>
        )}
      </div>

      {/* Order Groceries Button */}
      <button className="mt-10 bg-blue-500 text-white text-lg font-semibold px-6 py-3 rounded-lg shadow w-full max-w-sm">
        order groceries
      </button>

      {/* Clear Cart Button */}
      {cart.length > 0 && (
        <button
          onClick={clearCart}
          className="mt-4 bg-red-500 text-white text-lg font-semibold px-6 py-3 rounded-lg shadow w-full max-w-sm"
        >
          Clear Cart
        </button>
      )}

      {/* Back to Home Button */}
      <button
        onClick={() => router.push("/")}
        className="mt-4 bg-gray-300 text-black text-lg font-semibold px-6 py-3 rounded-lg shadow w-full max-w-sm"
      >
        Back to Home
      </button>
    </div>
  );
}
