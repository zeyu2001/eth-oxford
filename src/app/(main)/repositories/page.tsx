"use client";

import { useState } from "react";
import { useUserStore } from "@/stores/use-user-store";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { Spinner } from "@/components/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Book, ExternalLink, Lock, Radar } from "lucide-react";
import { useRouter } from "next/navigation";
import { ToastAction } from "@radix-ui/react-toast";

export default function Page() {
  const username = useUserStore((state) => state.username);
  const installationId = useUserStore((state) => state.installationId);

  const getRepositoriesQuery = api.user.repositories.useQuery(
    {
      installationId: installationId!,
    },
    {
      enabled: !!installationId,
    },
  );

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

  const repositories =
    getRepositoriesQuery.data?.sort((a, b) => {
      if (a.pushed_at && b.pushed_at) {
        return (
          new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime()
        );
      }
      return 0;
    }) ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold">Repositories</h1>
      <div className="space-y-4 py-4">
        {repositories.map((repo) => (
          <ScanRepositoryCard
            key={repo.full_name}
            isPrivate={repo.private}
            fullname={repo.full_name}
            language={repo.language ?? "Unknown"}
            pushedAt={repo.pushed_at ?? ""}
            htmlUrl={repo.html_url}
            username={username}
            installationId={installationId}
          />
        ))}
      </div>
    </div>
  );
}

const ScanRepositoryCard = ({
  isPrivate,
  fullname,
  language,
  pushedAt,
  htmlUrl,
  username,
  installationId,
}: {
  isPrivate: boolean;
  fullname: string;
  language: string;
  pushedAt: string;
  htmlUrl: string;
  username: string;
  installationId: number;
}) => {
  const { toast } = useToast();
  const router = useRouter();

  const [scanning, setScanning] = useState(false);

  const scanRepositoryMutation = api.scanner.scanRepository.useMutation({
    onMutate: () => {
      setScanning(true);
    },
    onSettled: () => {
      setScanning(false);
    },
    onSuccess: (data, _variables) => {
      toast({
        title: "Repository scanned",
        description: "The repository has been scanned successfully",
        action: (
          <ToastAction altText="View results">
            <Button
              onClick={() =>
                router.push(`/repositories/${data.repositoryId}/${data.id}`)
              }
            >
              View results
            </Button>
          </ToastAction>
        ),
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {isPrivate ? (
              <Lock className="mr-2 size-6" />
            ) : (
              <Book className="mr-2 size-6" />
            )}
            <span>{fullname}</span>
            <span className="ml-2 text-sm text-gray-500">{language}</span>
          </div>
          <Button variant="ghost">
            <Link
              href={htmlUrl}
              target="_blank"
              className="inline-flex items-center"
            >
              <span className="mr-1">View on GitHub</span>
              <ExternalLink />
            </Link>
          </Button>
        </div>
        <CardDescription>
          Last pushed {new Date(pushedAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <Button
          onClick={() => {
            toast({
              title: "Scanning repository",
              description: "This may take a while",
            });

            scanRepositoryMutation.mutate({
              username: username,
              installationId,
              repositoryId: fullname,
            });
          }}
          disabled={scanning}
        >
          {scanning ? (
            <span className="mr-2">
              <Spinner />
            </span>
          ) : (
            <Radar className="mr-2" />
          )}
          Scan repository
        </Button>
        <Button
          onClick={() => {
            router.push(`/repositories/${fullname}`);
          }}
        >
          View Results
        </Button>
      </CardContent>
    </Card>
  );
};
