"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/better-auth/auth-client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  return (
    <Button
      onClick={handleSignOut}
      variant="ghost"
      size="sm"
      className="text-zinc-400 hover:text-zinc-100"
    >
      Sign out
    </Button>
  );
}