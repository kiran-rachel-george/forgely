import { redirect } from "next/navigation";

import { HomePage } from "@/components/home/home-page";
import { getCurrentUser } from "@/lib/server-auth";

interface DashboardPageProps {
  searchParams?: {
    prompt?: string;
  };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    const query = new URLSearchParams({ next: "/dashboard" });

    if (searchParams?.prompt) {
      query.set("prompt", searchParams.prompt);
    }

    redirect(`/login?${query.toString()}`);
  }

  return (
    <HomePage
      user={{
        email: user.email ?? null,
        name:
          (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
          (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
          null,
        avatar_url:
          (typeof user.user_metadata?.avatar_url === "string" && user.user_metadata.avatar_url) ||
          null,
      }}
      initialPrompt={searchParams?.prompt ?? ""}
    />
  );
}
