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

  const fetchFilteredRecipes = async (selectedRestrictions: string[]) => {
    let query = supabase.from('Recipes').select('id, title, restrictions');

    // Apply filter only if there are selected restrictions
    if (selectedRestrictions.length > 0) {
      query = query.contains('restrictions', selectedRestrictions);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching filtered recipes:', error);
      return [];
    }

    return data;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!session) return;

      const userSettings = await fetchUserSettings();
      if (!userSettings) return;

      const selectedRestrictions = Object.entries(userSettings)
        .filter(([_, value]) => value)
        .map(([key]) => key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));

      const filteredRecipes = await fetchFilteredRecipes(selectedRestrictions);
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

      <h2 className="mb-4 text-xl font-semibold">Filtered Recipes</h2>
      {suggestedRecipes.length === 0 ? (
        <p>No matching recipes found.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {suggestedRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} id={recipe.id} title={recipe.title} />
          ))}
        </div>
      )}
    </div>
  );
}
