import { notFound } from "next/navigation";
import { getStaff } from "@/lib/auth";
import { toExercise } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { ExerciseForm } from "../ExerciseForm";

export default async function EditExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaff();
  if (staff.status !== "staff") return null;
  const { id } = await params;
  const { data } = await staff.supabase.from("exercises").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const exercise = toExercise(data);
  return (
    <>
      <PageHeader title={`Edit ${exercise.name}`} subtitle="Changes apply to new plans. Existing plans keep their saved sets and reps." />
      <ExerciseForm exercise={exercise} />
    </>
  );
}
