import { PageHeader } from "@/components/ui";
import { MemberForm } from "../MemberForm";

export const metadata = { title: "Add member — Gym Planner" };

export default function NewMemberPage() {
  return (
    <>
      <PageHeader title="Add member" subtitle="Fields with * are required." />
      <MemberForm />
    </>
  );
}
