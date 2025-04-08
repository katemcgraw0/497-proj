import Image from "next/image";
import { useRouter } from "next/router";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { MouseEvent, useEffect, useState } from "react";

interface RecipeCardProps {
  id: number;
  title: string;
  // New
  isSaved: boolean; // Are we rendering this card as a saved recipe or not?
  onRecipeSaveSuccess?: () => void;   // callback for post-save refresh
  onRecipeUnsaveSuccess?: () => void; // callback for post-unsave refresh
}

export default function RecipeCard({
  id,
  title,
  isSaved,
  onRecipeSaveSuccess,
  onRecipeUnsaveSuccess,
}: RecipeCardProps) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const session = useSession();

  // We'll store the image URL in state after fetching it
  const [imageUrl, setImageUrl] = useState("/file.svg"); // fallback icon initially

  // Fetch the public URL for this recipe's image in Supabase Storage
  useEffect(() => {
    const { data } = supabase.storage.from("recipes").getPublicUrl(`${id}.jpeg`);
    if (data?.publicUrl) {
      setImageUrl(data.publicUrl);
    } else {
      console.error("Error fetching image URL or public URL is missing.");
    }
  }, [id, supabase]);

  // Handler to SAVE the recipe
  const handleSave = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // so clicking doesn't also trigger card's onClick
    if (!session) {
      router.push("/login");
      return;
    }

    try {
      const { error } = await supabase.from("SavedRecipes").insert({
        recipe_id: id,
        user_id: session.user.id,
      });

      if (error) {
        console.error("Error saving recipe:", error);
        alert("Failed to save recipe.");
      } else {
        alert("Recipe saved!");
        if (onRecipeSaveSuccess) onRecipeSaveSuccess();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("An unexpected error occurred.");
    }
  };

  // Handler to UNSAVE the recipe
  const handleUnsave = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!session) {
      router.push("/login");
      return;
    }

    try {
      const { error } = await supabase
        .from("SavedRecipes")
        .delete()
        .match({ recipe_id: id, user_id: session.user.id });

      if (error) {
        console.error("Error unsaving recipe:", error);
        alert("Failed to unsave recipe.");
      } else {
        alert("Recipe removed from saved!");
        if (onRecipeUnsaveSuccess) onRecipeUnsaveSuccess();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("An unexpected error occurred.");
    }
  };

  return (
    <div
      onClick={() => router.push(`/recipes/${id}`)}
      className="cursor-pointer bg-gray-200 rounded-lg p-2 shadow-lg"
    >
      <Image
        src={imageUrl}
        alt={title}
        width={200}
        height={200}
        className="rounded-lg object-cover w-full h-24 md:h-32"
      />
      <h3 className="text-lg font-semibold mt-2">{title}</h3>

      {/* Conditionally render Save or Unsave */}
      {isSaved ? (
        <button
          onClick={handleUnsave}
          className="mt-2 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
        >
          Unsave
        </button>
      ) : (
        <button
          onClick={handleSave}
          className="mt-2 rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
        >
          Save Recipe
        </button>
      )}
    </div>
  );
}
