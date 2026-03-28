"use client";

import { signIn } from "next-auth/react";
import { useEffect } from "react";

export default function SignIn({ searchParams }) {
  useEffect(() => {
    const callbackUrl = searchParams?.callbackUrl || "/user";
    signIn("cilogon", { callbackUrl });
  }, []);

  return (
    <>
      <p>Signing you in</p>
    </>
  );
}
