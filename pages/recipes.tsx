import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'; 
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import RecipeCard from '@/components/RecipeCard';

interface Recipe {
  id: number;
  title: string;
  restrictions: string[];
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
  const [userRestrictions, setUserRestrictions] = useState<string[]>([]);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }
    // fetch user restrictions & saved recipes once
    fetchUserRestrictions();
    fetchSavedRecipes();
  }, [session]);

  // ----------------------------
  // FETCH USER RESTRICTIONS
  // ----------------------------
  const fetchUserRestrictions = async () => {
    if (!session) return;
    const { data, error } = await supabase
      .from('UserSettings')
      .select('vegan, gluten_free, vegetarian, dairy_free, nut_free')
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching user restrictions:', error);
      return;
    }

    const restrictionsMap: Record<keyof typeof data, string> = {
      vegan: 'Vegan',
      gluten_free: 'Gluten Free',
      vegetarian: 'Vegetarian',
      dairy_free: 'Dairy Free',
      nut_free: 'Nut Free',
    };

    const selectedRestrictions = Object.keys(data || {})
      .filter((key) => data[key as keyof typeof data])
      .map((key) => restrictionsMap[key as keyof typeof data]);
    setUserRestrictions(selectedRestrictions);
  };

  // ----------------------------
  // FETCH SAVED RECIPES
  // ----------------------------
  const fetchSavedRecipes = async () => {
    if (!session) return;
    setLoading(true);

    try {
      // get all saved recipe IDs for this user
      const { data: savedIds, error } = await supabase
        .from('SavedRecipes')
        .select('recipe_id')
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error fetching saved recipe IDs:', error);
        setLoading(false);
        return;
      }

      if (!savedIds || savedIds.length === 0) {
        setSavedRecipes([]);
        setLoading(false);
        return;
      }

      const recipeIds = savedIds.map((r) => r.recipe_id);

      // fetch recipe details for those IDs
      const { data: savedData, error: savedDataError } = await supabase
        .from('Recipes')
        .select('id, title, restrictions')
        .in('id', recipeIds);

      if (savedDataError) {
        console.error('Error fetching saved recipes:', savedDataError);
        setLoading(false);
        return;
      }

      setSavedRecipes(savedData || []);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // FETCH SUGGESTED or SEARCHED RECIPES
  // (Excluding saved ones if you want)
  // ----------------------------
  useEffect(() => {
    if (!session) return;

    const fetchRecipes = async () => {
      try {
        let query = supabase
          .from('Recipes')
          .select('id, title, restrictions');

        if (searchTerm) {
          // Searching
          query = query.ilike('title', `%${searchTerm}%`);
        } else {
          // Just suggested => get first 10
          query = query.order('id', { ascending: true }).limit(10);
        }

        const { data, error } = await query;
        if (error) {
          console.error('Error fetching recipes:', error);
          return;
        }

        // Filter by user restrictions
        const filterByRestrictions = (recipe: Recipe) =>
          userRestrictions.every((r) => recipe.restrictions.includes(r));
        const filteredRecipes = (data || []).filter(filterByRestrictions);

        // If you want to exclude saved from suggestions:
        // We'll do it only if there's no searchTerm
        if (!searchTerm && savedRecipes.length) {
          const savedIdsSet = new Set(savedRecipes.map((r) => r.id));
          // remove saved from the suggestions
          const unsaved = filteredRecipes.filter(
            (r) => !savedIdsSet.has(r.id)
          );
          setSuggestedRecipes(unsaved);
        } else if (!searchTerm) {
          setSuggestedRecipes(filteredRecipes);
        } else {
          setSearchedRecipes(filteredRecipes);
        }
      } catch (err) {
        console.error('Unexpected error in fetchRecipes:', err);
      }
    };

    fetchRecipes();
  }, [searchTerm, session, userRestrictions, savedRecipes]); 
  // Notice we also watch `savedRecipes`, so suggestions update when we save/unsave.

  // ----------------------------
  // HANDLERS for removing from local arrays
  // so the UI updates immediately
  // ----------------------------
  const removeFromSuggested = (recipeId: number) => {
    setSuggestedRecipes((prev) => prev.filter((r) => r.id !== recipeId));
  };

  const removeFromSearch = (recipeId: number) => {
    setSearchedRecipes((prev) => prev.filter((r) => r.id !== recipeId));
  };

  const removeFromSaved = (recipeId: number) => {
    setSavedRecipes((prev) => prev.filter((r) => r.id !== recipeId));
  };

  // For example, after we save from suggestions, remove that recipe from suggested
  // after we unsave from saved, remove from that array

  return (
    <div className="min-h-screen p-6">
      <button
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        onClick={() => router.push('/')}
      >
        Back to Home
      </button>

      <input
        type="text"
        placeholder="Search recipes..."
        className="w-full rounded border p-2 mt-4"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* SEARCH RESULTS */}
      {searchTerm ? (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Search Results</h2>
          {searchedRecipes.length === 0 ? (
            <p>No recipes found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {searchedRecipes.map((recipe) => {
                const isSaved = !!savedRecipes.find((sr) => sr.id === recipe.id);
                return (
                  <RecipeCard
                    key={recipe.id}
                    id={recipe.id}
                    title={recipe.title}
                    isSaved={isSaved}
                    // When user saves in search => remove from search, re-fetch saved
                    onRecipeSaveSuccess={() => {
                      removeFromSearch(recipe.id);
                      fetchSavedRecipes();
                    }}
                    onRecipeUnsaveSuccess={() => {
                      // If we do unsave from here, remove from saved, re-fetch
                      removeFromSaved(recipe.id);
                      fetchSavedRecipes();
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : (
        // SUGGESTED
        <div>
          <h2 className="mb-4 text-xl font-semibold">Suggested Recipes</h2>
          {suggestedRecipes.length === 0 ? (
            <p>No suggestions available.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {suggestedRecipes.map((recipe) => {
                // Check if this recipe is already saved
                const isSaved = !!savedRecipes.find((sr) => sr.id === recipe.id);
                return (
                  <RecipeCard
                    key={recipe.id}
                    id={recipe.id}
                    title={recipe.title}
                    isSaved={isSaved}
                    // On save => remove from suggested array, re-fetch saved
                    onRecipeSaveSuccess={() => {
                      removeFromSuggested(recipe.id);
                      fetchSavedRecipes();
                    }}
                    onRecipeUnsaveSuccess={() => {
                      removeFromSaved(recipe.id);
                      fetchSavedRecipes();
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SAVED RECIPES */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-bold">Your Saved Recipes</h2>
        {loading ? (
          <p>Loading saved recipes...</p>
        ) : savedRecipes.length === 0 ? (
          <p>No saved recipes found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {savedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                isSaved
                // When user unsaves here => remove from saved, optionally re-fetch
                onRecipeUnsaveSuccess={() => {
                  removeFromSaved(recipe.id);
                  // Optionally also re-fetch suggestions to show that recipe again
                  // fetchSuggestionsIfNeeded();
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
