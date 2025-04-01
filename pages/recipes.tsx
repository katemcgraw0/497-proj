import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import RecipeCard from '@/components/RecipeCard';

interface Recipe {
  id: number;
  title: string;
  restrictions?: string[];
}

export default function RecipesPage() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchedRecipes, setSearchedRecipes] = useState<Recipe[]>([]);
  const [suggestedRecipes, setSuggestedRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const SUGGESTED_RECIPES_LIMIT = 10;

  useEffect(() => {
    if (session === null) {
      router.push('/login');
    }
  }, [session, router]);

  const fetchUserSettings = async () => {
    if (!session) return null;

    const { data, error } = await supabase
      .from('UserSettings')
      .select('vegan, gluten_free, vegetarian, dairy_free, nut_free')
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching user settings:', error);
      return null;
    }

    return data;
  };

  const fetchFilteredRecipes = async (selectedRestrictions: string[], savedRecipeIds: number[]) => {
    let query = supabase.from('Recipes').select('id, title, restrictions');

    if (selectedRestrictions.length > 0) {
      query = query.contains('restrictions', selectedRestrictions);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching suggested recipes:', error);
      return [];
    }

    return data.filter(recipe => !savedRecipeIds.includes(recipe.id)).slice(0, SUGGESTED_RECIPES_LIMIT);
  };

  const fetchSavedRecipes = async () => {
    if (!session) return;

    setLoading(true);
    try {
      const { data: savedIds, error: savedError } = await supabase
        .from('SavedRecipes')
        .select('recipe_id')
        .eq('user_id', session.user.id);

      if (savedError) {
        console.error('Error fetching saved recipe IDs:', savedError);
        setSavedRecipes([]);
        setLoading(false);
        return [];
      }

      if (!savedIds || savedIds.length === 0) {
        setSavedRecipes([]);
        setLoading(false);
        return [];
      }

      const recipeIds = savedIds.map((r) => r.recipe_id);
      const { data: savedData, error: savedDataError } = await supabase
        .from('Recipes')
        .select('id, title')
        .in('id', recipeIds);

      if (savedDataError) {
        console.error('Error fetching saved recipes:', savedDataError);
        setSavedRecipes([]);
        setLoading(false);
        return [];
      }

      setSavedRecipes(savedData || []);
      return recipeIds;
    } catch (err) {
      console.error('Unexpected error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!session) return;

      const userSettings = await fetchUserSettings();
      if (!userSettings) return;

      const selectedRestrictions = Object.entries(userSettings)
        .filter(([_, value]) => value)
        .map(([key]) => key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));

      const savedRecipeIds = await fetchSavedRecipes();
      const filteredRecipes = await fetchFilteredRecipes(selectedRestrictions, savedRecipeIds);
      setSuggestedRecipes(filteredRecipes);
    };

    fetchData();
  }, [session]);

  return (
    <div className="min-h-screen p-6">
      <div className="mb-4">
        <button
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={() => router.push('/')}
        >
          Back to Home
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search recipes..."
          className="w-full rounded border p-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <h2 className="mb-4 text-xl font-semibold">Suggested Recipes</h2>
      {suggestedRecipes.length === 0 ? (
        <p>No matching recipes found.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {suggestedRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} id={recipe.id} title={recipe.title} />
          ))}
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-4 text-xl font-bold">Your Saved Recipes</h2>
        {loading ? (
          <p>Loading saved recipes...</p>
        ) : savedRecipes.length === 0 ? (
          <p>No saved recipes found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {savedRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} id={recipe.id} title={recipe.title} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
