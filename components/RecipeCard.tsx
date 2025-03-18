import Image from "next/image";
import { useRouter } from "next/router";

interface RecipeCardProps {
  id: number;
  title: string;
}

export default function RecipeCard({ id, title }: RecipeCardProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/recipes/${id}`)}
      className="cursor-pointer bg-gray-200 rounded-lg p-2 shadow-lg"
    >
      <Image
        src={`https://your-supabase-url.storage/v1/object/public/Recipes/${id}.jpeg`}
        alt={title}
        width={100}
        height={100}
        className="rounded-lg object-cover w-full h-24 md:h-32"
      />
    </div>
  );
}
