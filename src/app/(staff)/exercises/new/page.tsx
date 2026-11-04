import { PageHeader } from "@/components/ui";
import { ExerciseForm } from "../ExerciseForm";

export const metadata = { title: "Add exercise — Gym Planner" };

export default function NewExercisePage() {
  return (
    <>
      <PageHeader title="Add exercise" />
      <ExerciseForm />
    </>
  );
}
