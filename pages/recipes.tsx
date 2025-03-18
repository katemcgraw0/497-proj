import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import RecipeCard from '@/components/RecipeCard';

interface Recipe {
  id: number;
  title: string;
}

export default function RecipesPage() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If the session has loaded, but there's NO user, redirect to login
    if (session === null) {
      router.push('/login');
      return;
    }

    // If session is defined, fetch data
    if (session) {
      (async () => {
        setLoading(true);

        // 1) Fetch saved recipe IDs
        const { data: savedRecipes, error: savedError } = await supabase
          .from('SavedRecipes')
          .select('recipe_id')
          .eq('user_id', session.user.id); 
          // Make sure user_id is storing the same UUID as session.user.id

        if (savedError) {
          console.error('Error fetching saved recipes:', savedError);
          setLoading(false);
          return;
        }
        if (!savedRecipes || savedRecipes.length === 0) {
          setRecipes([]);
          setLoading(false);
          return;
        }

        const recipeIds = savedRecipes.map((r) => r.recipe_id);

        // 2) Fetch full recipe details
        const { data: recipeData, error: recipeError } = await supabase
          .from('Recipes')
          .select('id, title')
          .in('id', recipeIds);

        if (recipeError) {
          console.error('Error fetching recipe details:', recipeError);
          setLoading(false);
          return;
        }

        setRecipes(recipeData || []);
        setLoading(false);
      })();
    }
  }, [session, supabase, router]);

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Your Saved Recipes</h1>

      {loading ? (
        <p>Loading...</p>
      ) : recipes.length === 0 ? (
        <p>No saved recipes found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} id={recipe.id} title={recipe.title} />
          ))}
        </div>
      )}
    </div>
  );
}
