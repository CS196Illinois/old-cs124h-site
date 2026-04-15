"use client";

import { signIn } from "next-auth/react";
import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SignInInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const callbackUrl = searchParams?.get("callbackUrl") || "/user";
    signIn("cilogon", { callbackUrl });
  }, []);

  return <p>Signing you in</p>;
}

export default function SignIn() {
  return (
    <Suspense fallback={<p>Signing you in</p>}>
      <SignInInner />
    </Suspense>
  );
}
