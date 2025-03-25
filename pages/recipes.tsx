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

  // For search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchedRecipes, setSearchedRecipes] = useState<Recipe[]>([]);
  const [suggestedRecipes, setSuggestedRecipes] = useState<Recipe[]>([]);

  // For saved recipes
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  // 1) Session check
  useEffect(() => {
    if (session === null) {
      router.push('/login');
    }
  }, [session, router]);

  // 2) Function to fetch user’s saved recipes
  const fetchSavedRecipes = async () => {
    if (!session) return;

    setLoading(true);
    try {
      // Fetch saved recipe IDs
      const { data: savedIds, error: savedError } = await supabase
        .from('SavedRecipes')
        .select('recipe_id')
        .eq('user_id', session.user.id);

      if (savedError) {
        console.error('Error fetching saved recipe IDs:', savedError);
        setSavedRecipes([]);
        setLoading(false);
        return;
      }

      if (!savedIds || savedIds.length === 0) {
        setSavedRecipes([]);
        setLoading(false);
        return;
      }

      const recipeIds = savedIds.map((r) => r.recipe_id);

      // Fetch the actual saved recipes
      const { data: savedData, error: savedDataError } = await supabase
        .from('Recipes')
        .select('id, title')
        .in('id', recipeIds);

      if (savedDataError) {
        console.error('Error fetching saved recipes:', savedDataError);
        setSavedRecipes([]);
        setLoading(false);
        return;
      }

      setSavedRecipes(savedData || []);
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 3) UseEffect to initially load saved recipes
  useEffect(() => {
    if (session) {
      fetchSavedRecipes();
    }
  }, [session]);

  // 4) Search or fetch suggested recipes, excluding ones already saved
  useEffect(() => {
    if (!session) return; // wait for session

    const getRecipes = async () => {
      try {
        if (searchTerm.trim() === '') {
          // If no search term, fetch the first 10 recipes as "suggested"
          const { data: suggestData, error: suggestError } = await supabase
            .from('Recipes')
            .select('id, title')
            .order('id', { ascending: true })
            .limit(10);

          if (suggestError) {
            console.error('Error fetching suggested recipes:', suggestError);
            setSuggestedRecipes([]);
            return;
          }

          // Filter out any recipes that are already saved
          const savedIdsSet = new Set(savedRecipes.map((r) => r.id));
          const filteredSuggestions = (suggestData || []).filter(
            (recipe) => !savedIdsSet.has(recipe.id)
          );

          setSuggestedRecipes(filteredSuggestions);
          setSearchedRecipes([]);
        } else {
          // If the user typed something, do a case-insensitive search on title
          const { data: searchData, error: searchError } = await supabase
            .from('Recipes')
            .select('id, title')
            .ilike('title', `%${searchTerm}%`);

          if (searchError) {
            console.error('Error searching recipes:', searchError);
            setSearchedRecipes([]);
            return;
          }

          // Also filter out saved ones from the search results
          const savedIdsSet = new Set(savedRecipes.map((r) => r.id));
          const filteredSearch = (searchData || []).filter(
            (recipe) => !savedIdsSet.has(recipe.id)
          );

          setSearchedRecipes(filteredSearch);
          setSuggestedRecipes([]);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      }
    };

    getRecipes();
  }, [session, supabase, searchTerm, savedRecipes]);

  // If session is still undefined, you might show a loading message
  if (session === undefined) {
    return <p>Checking session...</p>;
  }

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

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search recipes..."
          className="w-full rounded border p-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Search Results or Suggestions */}
      {searchTerm ? (
        <div>
          <h2 className="mb-4 text-xl font-semibold">
            Search Results for: “{searchTerm}”
          </h2>
          {searchedRecipes.length === 0 ? (
            <p>No recipes found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {searchedRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  id={recipe.id}
                  title={recipe.title}
                  onRecipeSaveSuccess={fetchSavedRecipes}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Suggested Recipes</h2>
          {suggestedRecipes.length === 0 ? (
            <p>No suggestions available.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {suggestedRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  id={recipe.id}
                  title={recipe.title}
                  onRecipeSaveSuccess={fetchSavedRecipes}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Saved Recipes Section */}
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
                // Typically, no need for the save button in "saved" area,
                // but you could pass onRecipeSaveSuccess if you want to allow re-fetch for some reason.
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
