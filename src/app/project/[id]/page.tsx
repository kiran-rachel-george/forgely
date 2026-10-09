import { redirect } from "next/navigation";

import { WorkspaceLayout } from "@/components/builder/workspace-layout";
import { getCurrentUser } from "@/lib/server-auth";

interface ProjectPageProps {
  params: {
    id: string;
  };
  searchParams?: {
    autoPrompt?: string;
  };
}

export default async function ProjectPage({ params, searchParams }: ProjectPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    const query = new URLSearchParams({ next: `/project/${params.id}` });

    if (searchParams?.autoPrompt) {
      query.set("prompt", searchParams.autoPrompt);
    }

    redirect(`/login?${query.toString()}`);
  }

  return (
    <WorkspaceLayout
      projectId={params.id}
      autoPrompt={searchParams?.autoPrompt ?? ""}
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
    />
  );
}
