import Image from "next/image";
import { useRouter } from "next/router";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { MouseEvent } from "react";

interface RecipeCardProps {
  id: number;
  title: string;
  onRecipeSaveSuccess?: () => void; // callback for post-save refresh
}

export default function RecipeCard({
  id,
  title,
  onRecipeSaveSuccess,
}: RecipeCardProps) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const session = useSession();

  const handleSave = async (e: MouseEvent<HTMLButtonElement>) => {
    // Prevent the parent div's onClick from firing
    e.stopPropagation();

    if (!session) {
      router.push("/login");
      return;
    }

    try {
      const { error } = await supabase
        .from("SavedRecipes")
        .insert({
          recipe_id: id,
          user_id: session.user.id,
        });

      if (error) {
        console.error("Error saving recipe:", error);
        alert("Failed to save recipe.");
      } else {
        alert("Recipe saved!");
        // Call the parent callback to refresh saved recipes
        if (onRecipeSaveSuccess) onRecipeSaveSuccess();
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
        src={"/file.svg"}
        alt={title}
        width={20}
        height={100}
        className="rounded-lg object-cover w-full h-24 md:h-32"
      />
      <h3 className="text-lg font-semibold mt-2">{title}</h3>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="mt-2 rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
      >
        Save Recipe
      </button>
    </div>
  );
}
