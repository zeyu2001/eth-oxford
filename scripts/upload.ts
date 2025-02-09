/* eslint-disable */
// @ts-nocheck
import { artifacts, ethers } from "hardhat";

async function main() {
  const VULN_CONTRACT_ADDRESS = "0x0be7904080F6c55766cfeF38147125535921E3Ed"; // Replace with actual address
  const FIRST_VOTING_ROUND_TS = 1658429955;
  const VOTING_EPOCH_DURATION = 90;

  // Replace with your actual contract artifact name
  const Vuln = artifacts.require("Vuln");

  // If using Flare's FDC Hub
  const FDCHub = artifacts.require(
    "@flarenetwork/flare-periphery-contracts/coston/IFdcHub.sol:IFdcHub",
  );

  const {
    JQ_VERIFIER_URL_TESTNET,
    JQ_API_KEY,
    DA_LAYER_URL_COSTON,
    API_KEY,
    REPOSITORY_ID,
  } = process.env;

  const firstVotingRoundStartTs = 1658429955;
  const votingEpochDurationSeconds = 90;
  /**
   * Convert a string into a 32-byte hex for Flare API
   */
  function toHex(data: string): string {
    let result = "";
    for (let i = 0; i < data.length; i++) {
      result += data.charCodeAt(i).toString(16);
    }
    return result.padEnd(64, "0");
  }

  const attestationType = "0x" + toHex("IJsonApi");
  const sourceType = "0x" + toHex("WEB2");

  const repositoryId = REPOSITORY_ID;

  const requestData = {
    attestationType: attestationType,
    sourceId: sourceType,
    requestBody: {
      url: `https://codecure.analogue.computer/api/scans/${repositoryId}`,
      postprocessJq: `{
                id: .id,
                username: .username,
                repositoryId: .repositoryId,
                result: [ .result[] | {
                    id: .id,
                    file: .file,
                    startLine: .startLine,
                    startCol: .startCol,
                    endLine: .endLine,
                    endCol: .endCol,
                    severity: .severity,
                    message: .message,
                    code: (.code | .[:256]),
                    scanId: .scanId
                } ],
                updatedAt: .updatedAt,
            }`,
      abi_signature: `
            {\"components\": [
                {\"internalType\": \"uint256\",\"name\": \"id\",\"type\": \"uint256\"},
                {\"internalType\": \"string\",\"name\": \"username\",\"type\": \"string\"},
                {\"internalType\": \"string\",\"name\": \"repositoryId\",\"type\": \"string\"},
                {
                    \"internalType\": \"tuple[]\",
                    \"name\": \"result\",
                    \"type\": \"tuple[]\",
                    \"components\": [
                        {\"internalType\": \"uint256\",\"name\": \"id\",\"type\": \"uint256\"},
                        {\"internalType\": \"string\",\"name\": \"file\",\"type\": \"string\"},
                        {\"internalType\": \"uint256\",\"name\": \"startLine\",\"type\": \"uint256\"},
                        {\"internalType\": \"uint256\",\"name\": \"startCol\",\"type\": \"uint256\"},
                        {\"internalType\": \"uint256\",\"name\": \"endLine\",\"type\": \"uint256\"},
                        {\"internalType\": \"uint256\",\"name\": \"endCol\",\"type\": \"uint256\"},
                        {\"internalType\": \"string\",\"name\": \"severity\",\"type\": \"string\"},
                        {\"internalType\": \"string\",\"name\": \"message\",\"type\": \"string\"},
                        {\"internalType\": \"string\",\"name\": \"code\",\"type\": \"string\"},
                        {\"internalType\": \"uint256\",\"name\": \"scanId\",\"type\": \"uint256\"}
                    ]
                },
                {\"internalType\": \"string\",\"name\": \"updatedAt\",\"type\": \"string\"}
            ],
            \"name\": \"task\",\"type\": \"tuple\"}`,
    },
  };

  const response = await fetch(
    `${JQ_VERIFIER_URL_TESTNET}JsonApi/prepareRequest`,
    {
      method: "POST",
      headers: {
        "X-API-KEY": JQ_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    },
  );

  if (!response.ok) {
    throw new Error(`prepareRequest failed, status = ${response.status}`);
  }

  const data = await response.json();
  // const vuln = await ethers.getContractAt("Vuln", VULN_CONTRACT_ADDRESS);
  const vuln = await Vuln.at(VULN_CONTRACT_ADDRESS);
  const fdcHubAddress = await vuln.getFdcHub();
  //const fdcHub = await ethers.getContractAt("IFdcHub", fdcHubAddress);
  const fdcHub = await FDCHub.at(fdcHubAddress);
  const tx = await fdcHub.requestAttestation(data.abiEncodedRequest, {
    value: ethers.parseEther("0.5").toString(),
  });

  const blockNumber = tx.blockNumber;
  const block = await ethers.provider.getBlock(blockNumber);
  const roundId = Math.floor(
    (block!.timestamp - firstVotingRoundStartTs) / votingEpochDurationSeconds,
  );

  console.log(`Voting round ID determined: ${roundId}`);

  await new Promise((resolve) => setTimeout(resolve, 180000)); // Wait for 180 seconds

  const proofResponse = await fetch(
    `${DA_LAYER_URL_COSTON}fdc/get-proof-round-id-bytes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": API_KEY,
      },
      body: JSON.stringify({
        votingRoundId: roundId,
        requestBytes: data.abiEncodedRequest,
      }),
    },
  );

  if (!proofResponse.ok) {
    throw new Error(`getProof failed, status = ${proofResponse.status}`);
  }

  const proofAndData = await proofResponse.json();
  console.log("🔹 Proof data retrieved:", proofAndData);

  // Submit the proof to the smart contract
  console.log("🔹 Submitting proof to blockchain...");
  const proofTx = await vuln.addScans({
    merkleProof: proofAndData.proof,
    data: proofAndData.response,
  });

  console.log("🔹 Proof successfully submitted:", proofTx);
}

main();
