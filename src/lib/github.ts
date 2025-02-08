import { env } from "@/env";
import { App } from "octokit";

const app = new App({
  appId: 1137940,
  privateKey: env.GITHUB_APP_PRIVATE_KEY,
});

export const getInstallation = async (installationId: number) => {
  const octokit = await app.getInstallationOctokit(installationId);
  return await octokit.rest.apps.getInstallation({
    installation_id: installationId,
  });
};
