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
    if (session === null) {
      router.push('/login');
    } else {
      fetchUserRestrictions();
      fetchSavedRecipes();
    }
  }, [session]);

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
  
    // Log the data to ensure it has the expected structure
    console.log('Fetched UserSettings:', data);
  
    // Ensure the data is correctly structured
    const restrictionsMap: { [key in keyof typeof data]: string } = {
      vegan: 'Vegan',
      gluten_free: 'Gluten Free',
      vegetarian: 'Vegetarian',
      dairy_free: 'Dairy Free',
      nut_free: 'Nut Free',
    };
  
    // Generate the selectedRestrictions list
    const selectedRestrictions = Object.keys(data)
      .filter((key) => data[key as keyof typeof data])  // Only select the ones that are true
      .map((key) => restrictionsMap[key as keyof typeof data]);  // Map to the string labels
  
    setUserRestrictions(selectedRestrictions);  // Set the restrictions state
  };
  

  const fetchSavedRecipes = async () => {
    if (!session) return;
    setLoading(true);
    const { data: savedIds, error } = await supabase
      .from('SavedRecipes')
      .select('recipe_id')
      .eq('user_id', session.user.id);
    if (error) {
      console.error('Error fetching saved recipe IDs:', error);
      setLoading(false);
      return;
    }
    const recipeIds = savedIds.map((r) => r.recipe_id);
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
    setLoading(false);
  };

  useEffect(() => {
    const fetchRecipes = async () => {
      if (!session) return;
      let query = supabase.from('Recipes').select('id, title, restrictions');
      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      } else {
        query = query.order('id', { ascending: true }).limit(10);
      }
      const { data, error } = await query;
      if (error) {
        console.error('Error fetching recipes:', error);
        return;
      }
      const filterByRestrictions = (recipe: Recipe) =>
        userRestrictions.every((r) => recipe.restrictions.includes(r));
      const filteredRecipes = (data || []).filter(filterByRestrictions);
      if (searchTerm) {
        setSearchedRecipes(filteredRecipes);
      } else {
        setSuggestedRecipes(filteredRecipes);
      }
    };
    fetchRecipes();
  }, [searchTerm, session, userRestrictions]);

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
      {searchTerm ? (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Search Results</h2>
          {searchedRecipes.length === 0 ? (
            <p>No recipes found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {searchedRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} id={recipe.id} title={recipe.title} />
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
                <RecipeCard key={recipe.id} id={recipe.id} title={recipe.title} />
              ))}
            </div>
          )}
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
