"use client";

import { useUserStore } from "@/stores/use-user-store";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { Spinner } from "@/components/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Book, ExternalLink, Lock, Radar } from "lucide-react";

export default function Page() {
  const { toast } = useToast();

  const username = useUserStore((state) => state.username);
  const installationId = useUserStore((state) => state.installationId);

  const getRepositoriesQuery = api.user.repositories.useQuery(
    {
      installationId,
    },
    {
      enabled: !!installationId,
    },
  );
  const scanRepositoryMutation = api.scanner.scanRepository.useMutation();

  if (username === null || installationId === null) {
    return (
      <p>To get started, please install CodeCure on your GitHub account.</p>
    );
  }

  if (
    username === undefined ||
    installationId === undefined ||
    getRepositoriesQuery.isLoading
  ) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (getRepositoriesQuery.error) {
    return <p>Failed to get repositories</p>;
  }

  const repositories = getRepositoriesQuery.data.sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">Repositories</h1>
      <div className="space-y-4 py-4">
        {repositories.map((repo) => (
          <Card key={repo.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {repo.private ? (
                    <Lock className="mr-2 size-6" />
                  ) : (
                    <Book className="mr-2 size-6" />
                  )}
                  <span>{repo.full_name}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    {repo.language}
                  </span>
                </div>
                <Button variant="ghost">
                  <Link
                    href={repo.html_url}
                    target="_blank"
                    className="inline-flex items-center"
                  >
                    <span className="mr-1">View on GitHub</span>
                    <ExternalLink />
                  </Link>
                </Button>
              </div>
              <CardDescription>
                Last updated {new Date(repo.updated_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => {
                  toast({
                    title: "Scanning repository",
                    description: "This may take a while",
                  });

                  scanRepositoryMutation.mutate({
                    installationId,
                    repositoryId: repo.full_name,
                  });
                }}
              >
                <Radar className="mr-2 size-6" />
                Scan repository
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
