import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AccountNav } from "@/components/account/account-nav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/ingresar?callbackUrl=/cuenta");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-4xl font-medium">Mi cuenta</h1>
      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
        <AccountNav isAdmin={session.user.role === "ADMIN"} />
        <div className="mt-6 lg:mt-0">{children}</div>
      </div>
    </div>
  );
}
