import { env } from "@/env";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
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
  return await octokit.paginate(
    octokit.rest.apps.listReposAccessibleToInstallation,
    {
      installation_id: installationId,
      per_page: 100,
    },
  );
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

  spawnSync("gh", ["repo", "clone", cloneUrl, tempDir], {
    env: {
      ...process.env,
      GITHUB_TOKEN: cloneToken,
    },
  });

  return tempDir;
};

export const createBranch = async (
  installationId: number,
  repositoryId: string,
  branchName: string,
  sha: string,
) => {
  const octokit = await app.getInstallationOctokit(installationId);
  const result = await octokit.rest.git.createRef({
    owner: repositoryId.split("/")[0],
    repo: repositoryId.split("/")[1],
    ref: `refs/heads/${branchName}`,
    sha,
  });

  return result;
};

export const commitFile = async (
  installationId: number,
  repositoryId: string,
  branchName: string,
  filepath: string,
  content: string,
  message: string,
) => {
  const octokit = await app.getInstallationOctokit(installationId);
  const result = await octokit.rest.repos.createOrUpdateFileContents({
    owner: repositoryId.split("/")[0],
    repo: repositoryId.split("/")[1],
    message: message,
    content: Buffer.from(content).toString("base64"),
    branch: branchName,
  });

  return result;
};

export const createPR = async (
  installationId: number,
  repositoryId: string,
  title: string,
  body: string,
  head: string,
  base: string,
) => {
  const octokit = await app.getInstallationOctokit(installationId);
  const result = await octokit.rest.pulls.create({
    owner: repositoryId.split("/")[0],
    repo: repositoryId.split("/")[1],
    title,
    body,
    head,
    base,
  });

  return result;
};
