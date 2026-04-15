"use client";

import { signIn } from "next-auth/react";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function SignIn() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const callbackUrl = searchParams?.get("callbackUrl") || "/user";
    signIn("cilogon", { callbackUrl });
  }, []);

  return (
    <>
      <p>Signing you in</p>
    </>
  );
}
