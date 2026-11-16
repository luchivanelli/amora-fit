import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/admin/shell/sidebar";
import { BottomNav } from "@/components/admin/shell/bottom-nav";
import { TopBar } from "@/components/admin/shell/top-bar";
import { PanelTransition } from "@/components/motion/panel-transition";
import { OnboardingTour } from "@/components/admin/help/onboarding-tour";
import { ThemedToaster } from "@/components/theme/themed-toaster";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel AMORA" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/ingresar?callbackUrl=/admin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, onboardingSeenAt: true },
  });
  const userName = user?.name || session.user.email || "Administradora";

  return (
    <div className="flex min-h-dvh bg-cream">
      <Sidebar userName={userName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar userName={userName} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
          <PanelTransition>{children}</PanelTransition>
        </main>
      </div>
      <BottomNav />
      <OnboardingTour show={!user?.onboardingSeenAt} />
      <ThemedToaster duration={3500} />
    </div>
  );
}
