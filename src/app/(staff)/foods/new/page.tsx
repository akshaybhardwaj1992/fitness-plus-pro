import { PageHeader } from "@/components/ui";
import { FoodForm } from "../FoodForm";

export const metadata = { title: "Add food — Gym Planner" };

export default function NewFoodPage() {
  return (
    <>
      <PageHeader title="Add food" subtitle="Enter numbers for ONE serving, from IFCT 2017, USDA or the pack label." />
      <FoodForm />
    </>
  );
}
