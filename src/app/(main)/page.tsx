"use client";

import { useUserStore } from "@/stores/use-user-store";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { GithubInstallationCard } from "./githubInstallationCard";
import { Chart } from "../_components/chart";
import { RecentScans } from "../_components/recentScans";
import Metamask from "../_components/metamask";

export default function Page() {
  const { toast } = useToast();

  const username = useUserStore((state) => state.username);
  const installationId = useUserStore((state) => state.installationId);
  const changeUsername = useUserStore((state) => state.changeUsername);
  const changeInstallationId = useUserStore(
    (state) => state.changeInstallationId,
  );
  const queryParams = useSearchParams();
  const newInstallationId = queryParams.get("installation_id");

  const installationQuery = api.user.installation.useQuery(
    {
      installationId: newInstallationId
        ? parseInt(newInstallationId)
        : installationId!,
    },
    {
      enabled: !!newInstallationId || !!installationId,
    },
  );

  useEffect(() => {
    if (newInstallationId) {
      console.log("newInstallationId", newInstallationId);
      console.log("installationQuery", installationQuery.isSuccess);
      if (installationQuery.error) {
        toast({
          variant: "destructive",
          title: "Uh oh!",
          description: "Failed to get account information",
        });
      } else if (installationQuery.isLoading) {
        toast({
          title: "Loading...",
          description: "Getting account information...",
        });
      } else if (installationQuery.isSuccess) {
        const account = installationQuery.data;
        if (account.data.account && "login" in account.data.account) {
          changeInstallationId(parseInt(newInstallationId));
          changeUsername(account.data.account.login);
          toast({
            title: "Success!",
            description: "Successfully installed CodeCure",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Uh oh!",
            description: "Failed to get account information",
          });
        }
      }
    }
  }, [
    newInstallationId,
    installationQuery.isSuccess,
    installationQuery.error,
    installationQuery.isLoading,
  ]);

  return (
    <div className="space-y-4">
      <GithubInstallationCard
        installationId={installationId}
        username={username}
      />
      {username && installationId && (
        <div className="grid grid-cols-2 gap-4">
          <Chart />
          <RecentScans />
        </div>
      )}
    </div>
  );
}
