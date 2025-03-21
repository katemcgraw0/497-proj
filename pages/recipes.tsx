import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import RecipeCard from '@/components/RecipeCard';

interface Recipe {
  id: number;
  title: string;
  // Add other fields if needed (e.g., ingredients, instructions)
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
    // If we have loaded the session and there's no user, redirect
    if (session === null) {
      router.push('/login');
    }
  }, [session, router]);

  // 2) Fetch saved recipes
  useEffect(() => {
    if (!session) return; // session may be loading

    (async () => {
      try {
        setLoading(true);

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
    })();
  }, [session, supabase]);

  // 3) Search or fetch suggested recipes
  useEffect(() => {
    if (!session) return; // session may be loading

    (async () => {
      try {
        if (searchTerm.trim() === '') {
          // If no search term, get "suggested" recipes
          // For example, fetch the first 10 recipes by ID
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
          setSuggestedRecipes(suggestData || []);
          setSearchedRecipes([]);
        } else {
          // If user typed something, do a case-insensitive search on title
          const { data: searchData, error: searchError } = await supabase
            .from('Recipes')
            .select('id, title')
            .ilike('title', `%${searchTerm}%`);

          if (searchError) {
            console.error('Error searching recipes:', searchError);
            setSearchedRecipes([]);
            return;
          }
          setSearchedRecipes(searchData || []);
          setSuggestedRecipes([]);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      }
    })();
  }, [session, supabase, searchTerm]);

//   // 4) Optional: Generate public image URL from the "Recipes" bucket
//   const getImageUrl = (recipeId: number) => {
//     // Adjust if you need a signed URL or if your bucket isn't public
//     const { data } = supabase.storage
//       .from('Recipes')
//       .getPublicUrl(`${recipeId}.jpeg`);
//     return data?.publicUrl ?? '';
//   };

//   // If session is still unknown or we’re redirecting, you can show loading
//   if (session === undefined) {
//     return <p>Checking session...</p>;
//   }

  return (
    <div className="min-h-screen p-6">
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
          <h2 className="text-xl font-semibold mb-4">
            Search Results for: “{searchTerm}”
          </h2>
          {searchedRecipes.length === 0 ? (
            <p>No recipes found.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {searchedRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  id={recipe.id}
                  title={recipe.title}
                //   imageUrl={getImageUrl(recipe.id)} // if you want images
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-4">Suggested Recipes</h2>
          {suggestedRecipes.length === 0 ? (
            <p>No suggestions available.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {suggestedRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  id={recipe.id}
                  title={recipe.title}
                //   imageUrl={getImageUrl(recipe.id)} // if you want images
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Saved Recipes Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Your Saved Recipes</h2>
        {loading ? (
          <p>Loading saved recipes...</p>
        ) : savedRecipes.length === 0 ? (
          <p>No saved recipes found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {savedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                // imageUrl={getImageUrl(recipe.id)} // if you want images
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
