import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Skeleton className="mx-auto mb-48 h-[480px] w-full rounded-[2rem]" />
      }
    >
      <LoginForm />
    </Suspense>
  );
}
