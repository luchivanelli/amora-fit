"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resetOnboarding } from "@/server/actions/admin/onboarding";

export function ReplayTourButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="secondary"
      loading={pending}
      onClick={() =>
        start(async () => {
          const res = await resetOnboarding();
          if (!res.ok) { toast.error(res.error); return; }
          router.push("/admin");
          router.refresh();
        })
      }
    >
      <PlayCircle className="size-5" aria-hidden /> Ver el recorrido de nuevo
    </Button>
  );
}
