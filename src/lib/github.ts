import { env } from "@/env";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdtempSync } from "node:fs";
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

export const getRepositories = async (installationId: number) => {
  const octokit = await app.getInstallationOctokit(installationId);
  return await octokit.rest.apps.listReposAccessibleToInstallation({
    installation_id: installationId,
  });
};

export const cloneRepository = async (
  installationId: number,
  repositoryId: string,
) => {
  const octokit = await app.getInstallationOctokit(installationId);
  const repository = await octokit.rest.repos.get({
    owner: repositoryId.split("/")[0],
    repo: repositoryId.split("/")[1],
  });

  const cloneUrl = repository.data.clone_url;
  const cloneToken = repository.data.temp_clone_token;

  const tempDir = mkdtempSync(
    `tmp/clone-${repositoryId.split("/")[0]}-${repositoryId.split("/")[1]}-`,
  );

  spawnSync("git", ["clone", cloneUrl, tempDir], {
    env: {
      ...process.env,
      GITHUB_TOKEN: cloneToken,
    },
  });

  return tempDir;
};
