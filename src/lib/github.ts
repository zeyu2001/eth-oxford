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

  const {
    data: { token },
  } = await octokit.rest.apps.createInstallationAccessToken({
    installation_id: installationId,
  });

  const repository = await octokit.rest.repos.get({
    owner: repositoryId.split("/")[0]!,
    repo: repositoryId.split("/")[1]!,
  });

  const cloneUrl = repository.data.clone_url;

  const tempDir = mkdtempSync(
    `tmp/clone-${repositoryId.split("/")[0]}-${repositoryId.split("/")[1]}-`,
  );

  spawnSync("gh", ["repo", "clone", cloneUrl, tempDir], {
    env: {
      ...process.env,
      GITHUB_TOKEN: token,
    },
  });

  return tempDir;
};

export const getDefaultBranch = async (
  installationId: number,
  repositoryId: string,
) => {
  const octokit = await app.getInstallationOctokit(installationId);
  const { data: repoData } = await octokit.rest.repos.get({
    owner: repositoryId.split("/")[0]!,
    repo: repositoryId.split("/")[1]!,
  });

  return repoData.default_branch;
};

export const getLatestSha = async (
  installationId: number,
  repositoryId: string,
  ref: string,
) => {
  const octokit = await app.getInstallationOctokit(installationId);
  const { data: refData } = await octokit.rest.git.getRef({
    owner: repositoryId.split("/")[0]!,
    repo: repositoryId.split("/")[1]!,
    ref: `heads/${ref}`,
  });
  return refData.object.sha;
};

export const createBranch = async (
  installationId: number,
  repositoryId: string,
  branchName: string,
  sha: string,
) => {
  const octokit = await app.getInstallationOctokit(installationId);
  const result = await octokit.rest.git.createRef({
    owner: repositoryId.split("/")[0]!,
    repo: repositoryId.split("/")[1]!,
    ref: `refs/heads/${branchName}`,
    sha: sha,
  });

  return result;
};

export const getFileSHA = async (
  installationId: number,
  repositoryId: string,
  branchName: string,
  filepath: string,
) => {
  const octokit = await app.getInstallationOctokit(installationId);
  const { data: fileData } = await octokit.rest.repos.getContent({
    owner: repositoryId.split("/")[0]!,
    repo: repositoryId.split("/")[1]!,
    path: filepath,
    ref: branchName,
  });

  if ("sha" in fileData) {
    return fileData.sha;
  }
  throw new Error("Failed to get file SHA");
};

export const commitFile = async (
  installationId: number,
  repositoryId: string,
  branchName: string,
  filepath: string,
  content: string,
  message: string,
  fileSHA: string,
) => {
  const octokit = await app.getInstallationOctokit(installationId);
  const result = await octokit.rest.repos.createOrUpdateFileContents({
    owner: repositoryId.split("/")[0]!,
    repo: repositoryId.split("/")[1]!,
    message: message,
    content: Buffer.from(content).toString("base64"),
    branch: branchName,
    path: filepath,
    sha: fileSHA,
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
    owner: repositoryId.split("/")[0]!,
    repo: repositoryId.split("/")[1]!,
    title,
    body,
    head,
    base,
  });

  return result;
};
