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
        src={"/file.svg"}
        alt={title}
        width={20}
        height={100}
        className="rounded-lg object-cover w-full h-24 md:h-32"
      />
      <h3 className="text-lg font-semibold mt-2">{title}</h3>
    </div>
  );
}
