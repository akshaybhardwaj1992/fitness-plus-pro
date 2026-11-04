import { getSupabaseEnv } from "@/lib/supabase/env";
import { getStaff } from "@/lib/auth";
import { SetupNeeded } from "@/components/SetupNeeded";
import { Nav } from "@/components/Nav";
import { logout } from "@/app/login/actions";
import { buttonClass } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  if (!getSupabaseEnv()) return <SetupNeeded />;
  const staff = await getStaff();

  if (staff.status !== "staff") {
    return (
      <main className="mx-auto max-w-lg p-6">
        <div className="rounded-2xl border border-warn/60 bg-card p-6">
          <h1 className="text-xl font-bold">This account is not a staff account</h1>
          <p className="mt-2 text-muted">
            You are logged in as <b>{staff.email}</b>, but only staff can use this app. Ask the gym owner to give
            your account staff access (see README → “Add a staff account”).
          </p>
          <form action={logout} className="mt-4">
            <button className={buttonClass("secondary")}>Log out</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <>
      <Nav name={staff.name} />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6">{children}</main>
    </>
  );
}
