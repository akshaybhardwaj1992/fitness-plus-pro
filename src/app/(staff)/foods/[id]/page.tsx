import { notFound } from "next/navigation";
import { getStaff } from "@/lib/auth";
import { toFood } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { FoodForm } from "../FoodForm";

export default async function EditFoodPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaff();
  if (staff.status !== "staff") return null;
  const { id } = await params;
  const { data } = await staff.supabase.from("foods").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const food = toFood(data);
  return (
    <>
      <PageHeader title={`Edit ${food.name}`} subtitle="Changes apply to new plans. Existing plans keep their saved numbers." />
      <FoodForm food={food} />
    </>
  );
}
