import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useShoppingCart } from '@/context/ShoppingCartContext'; // Import the context

interface Recipe {
  id: number;
  title: string;
  ingredients: string[];
}

export default function RecipeDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const supabase = useSupabaseClient();
  const { addToCart } = useShoppingCart(); // Get the function from context to add to cart
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false); // Track if the recipe is added to the cart

  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('Recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching recipe:', error);
      } else {
        setRecipe(data);
      }

      setLoading(false);
    })();
  }, [id, supabase]);

  if (loading) return <p className="p-6 text-center">Loading recipe...</p>;
  if (!recipe) return <p className="p-6 text-center">Recipe not found.</p>;

  // Handle Add to Cart button click
  const handleAddToCart = () => {
    if (recipe && recipe.ingredients) {
      addToCart(recipe.ingredients); // Adds all ingredients to the shopping cart
      setAddedToCart(true); // Update state to indicate that the recipe was added to the cart
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-6">{recipe.title}</h1>

      <h2 className="text-lg font-semibold mb-4">Ingredients</h2>

      <div className="space-y-3 w-full max-w-sm">
        {recipe.ingredients.map((ingredient, index) => (
          <div
            key={index}
            className="bg-gray-200 text-gray-800 text-center px-4 py-2 rounded-md shadow"
          >
            {ingredient}
          </div>
        ))}
      </div>

      <button
        className={`mt-6 px-6 py-2 rounded-lg shadow w-full max-w-sm ${addedToCart ? 'bg-green-700' : 'bg-green-500'} text-white`}
        onClick={handleAddToCart}
        disabled={addedToCart} // Disable the button after adding to cart
      >
        {addedToCart ? 'Added to Cart' : 'Add to Cart'}
      </button>

      <button
        className="mt-6 bg-blue-500 text-white px-6 py-2 rounded-lg shadow w-full max-w-sm"
        onClick={() => router.push('/recipes')}
      >
        Back to Recipes
      </button>
    </div>
  );
}
