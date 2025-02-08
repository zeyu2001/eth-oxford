import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";
import Link from "next/link";

export const GithubInstallationCard = ({
  installationId,
  username,
}: {
  installationId: number | null | undefined;
  username: string | null | undefined;
}) => {
  if (!installationId || !username) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-2xl font-bold">Install GitHub Integration</h1>
          </CardTitle>
          <CardDescription>
            Install CodeCure on your GitHub user account to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <InfoIcon className="mr-2 size-6" />
            <AlertDescription>
              The authorization process allows you to grant access to specific
              repositories or all repositories in your account. CodeCure will
              only be able to scan repositories you grant access to.
            </AlertDescription>
          </Alert>
          <Button className="mt-4">
            <Link href="https://github.com/apps/codecure-integration">
              Install GitHub Integration
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  } else {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-2xl font-bold">GitHub Integration</h1>
          </CardTitle>
          <CardDescription>
            CodeCure is installed on your GitHub account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="mt-4">
            <Link href="https://github.com/apps/codecure-integration">
              Manage GitHub Integration
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
};
