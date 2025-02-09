/* eslint-disable */
// @ts-nocheck
"use client";

import * as React from "react";
import { useState } from "react";
import { ethers } from "ethers";
import dotenv from "dotenv";
import { Button } from "@/components/ui/button";
import { LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

dotenv.config();

const VULN_CONTRACT_ADDRESS = "0x0be7904080F6c55766cfeF38147125535921E3Ed";
// const FDCHub_ADDRESS = "<FDCHub_CONTRACT_ADDRESS>"; // Replace if needed

const JQ_VERIFIER_URL_TESTNET = process.env.NEXT_PUBLIC_JQ_VERIFIER_URL_TESTNET;
const JQ_API_KEY = process.env.NEXT_PUBLIC_JQ_API_KEY;
// const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const DA_LAYER_URL_COSTON = process.env.NEXT_PUBLIC_DA_LAYER_URL_COSTON;

export default function Metamask({ repositoryId }: { repositoryId: string }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [roundId, setRoundId] = useState<number>(0);
  const { toast } = useToast();

  // Connect MetaMask Wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // const provider = new ethers.JsonRpcProvider("https://coston-api.flare.network/ext/C/rpc");
        const provider = new ethers.BrowserProvider(window.ethereum);
        console.log(await provider.getNetwork());
        const signer = await provider.getSigner();
        setWalletAddress(await signer.getAddress());
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("MetaMask not detected!");
    }
  };

  // Convert string to 32-byte hex
  const toHex = (data: string) => {
    let result = "";
    for (let i = 0; i < data.length; i++) {
      result += data.charCodeAt(i).toString(16);
    }
    return result.padEnd(64, "0");
  };

  // Prepare request for Flare Verifier
  const prepareRequest = async (REPOSITORY_ID: string) => {
    const attestationType = "0x" + toHex("IJsonApi");
    const sourceType = "0x" + toHex("WEB2");

    const requestData = {
      attestationType: attestationType,
      sourceId: sourceType,
      requestBody: {
        url: `https://codecure.analogue.computer/api/scans/${REPOSITORY_ID}`,
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
    return response.json();
  };

  // Submit Attestation Request
  const submitRequest = async () => {
    if (!walletAddress) return alert("Connect your wallet first!");

    setIsLoading(true);
    toast({ description: "Preparing request..." });

    try {
      //   const provider = new ethers.JsonRpcProvider(window.ethereum);
      // const provider = new ethers.BrowserProvider(window.ethereum);
      // const network = await provider.getNetwork();
      //   console.log("HELLO");

      //   const signer = await provider.getSigner();
      //   console.log("HELLO");

      // Initialize provider for Songbird Testnet
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Initialize signer using MetaMask
      const signer = await provider.getSigner();
      console.log(VULN_CONTRACT_ADDRESS);

      const vuln = new ethers.Contract(
        VULN_CONTRACT_ADDRESS,
        ["function getFdcHub() view returns (address)"],
        signer,
      );
      console.log(vuln);

      const fdcHubAddress = await vuln.getFdcHub();
      console.log(fdcHubAddress);

      const fdcHub = new ethers.Contract(
        fdcHubAddress,
        ["function requestAttestation(bytes calldata) payable"],
        signer,
      );

      console.log(JQ_VERIFIER_URL_TESTNET);
      console.log(JQ_API_KEY);
      const requestData = await prepareRequest(repositoryId);
      toast({
        description: "Submitting request to Flare...",
      });
      console.log("HELLO");

      const tx = await fdcHub.requestAttestation(
        requestData.abiEncodedRequest,
        { value: ethers.parseEther("0.5") },
      );
      await tx.wait();
      toast({
        description:
          "Request submitted. Waiting for voting round to complete...",
      });

      // Get the round ID
      const block = await provider.getBlock(tx.blockNumber);
      const roundId = Math.floor((block!.timestamp - 1658429955) / 90);
      console.log("Voting Round ID:", roundId);
      setRoundId(roundId);

      // Wait 180 seconds
      await new Promise((resolve) => setTimeout(resolve, 180000));

      // Submit proof
      await submitProof(roundId, requestData);
    } catch (error) {
      console.error("Error submitting request:", error);
      toast({ description: "Error submitting request. See console." });
    } finally {
      setIsLoading(false);
    }
  };

  // Get Proof and Submit to Smart Contract
  const submitProof = async (roundId: number, requestData) => {
    toast({ description: "Fetching proof..." });

    try {
      console.log("HELLO");
      const proofResponse = await fetch(
        `${DA_LAYER_URL_COSTON}fdc/get-proof-round-id-bytes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          //headers: { "Content-Type": "application/json", "X-API-KEY": API_KEY },
          body: JSON.stringify({
            votingRoundId: roundId,
            requestBytes: requestData.abiEncodedRequest,
          }),
        },
      );

      const dataAndProof = await proofResponse.json();
      console.log(dataAndProof.proof);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      //const vuln = new ethers.Contract(VULN_CONTRACT_ADDRESS, ["function addScans(bytes32[], (bytes))"], signer);

      const vuln = new ethers.Contract(
        VULN_CONTRACT_ADDRESS,
        [
          {
            inputs: [
              {
                components: [
                  {
                    internalType: "bytes32[]",
                    name: "merkleProof",
                    type: "bytes32[]",
                  },
                  {
                    components: [
                      {
                        internalType: "bytes32",
                        name: "attestationType",
                        type: "bytes32",
                      },
                      {
                        internalType: "bytes32",
                        name: "sourceId",
                        type: "bytes32",
                      },
                      {
                        internalType: "uint64",
                        name: "votingRound",
                        type: "uint64",
                      },
                      {
                        internalType: "uint64",
                        name: "lowestUsedTimestamp",
                        type: "uint64",
                      },
                      {
                        components: [
                          {
                            internalType: "string",
                            name: "url",
                            type: "string",
                          },
                          {
                            internalType: "string",
                            name: "postprocessJq",
                            type: "string",
                          },
                          {
                            internalType: "string",
                            name: "abi_signature",
                            type: "string",
                          },
                        ],
                        internalType: "struct IJsonApi.RequestBody",
                        name: "requestBody",
                        type: "tuple",
                      },
                      {
                        components: [
                          {
                            internalType: "bytes",
                            name: "abi_encoded_data",
                            type: "bytes",
                          },
                        ],
                        internalType: "struct IJsonApi.ResponseBody",
                        name: "responseBody",
                        type: "tuple",
                      },
                    ],
                    internalType: "struct IJsonApi.Response",
                    name: "data",
                    type: "tuple",
                  },
                ],
                internalType: "struct IJsonApi.Proof",
                name: "data",
                type: "tuple",
              },
            ],
            name: "addScans",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
          {
            inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
            name: "allRepos",
            outputs: [{ internalType: "string", name: "", type: "string" }],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [],
            name: "getAllRepos",
            outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [],
            name: "getFdcHub",
            outputs: [
              { internalType: "contract IFdcHub", name: "", type: "address" },
            ],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [],
            name: "getFdcRequestFeeConfigurations",
            outputs: [
              {
                internalType: "contract IFdcRequestFeeConfigurations",
                name: "",
                type: "address",
              },
            ],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [
              { internalType: "string", name: "repositoryId", type: "string" },
            ],
            name: "getRepoScans",
            outputs: [
              {
                components: [
                  { internalType: "uint256", name: "id", type: "uint256" },
                  { internalType: "string", name: "username", type: "string" },
                  {
                    internalType: "string",
                    name: "repositoryId",
                    type: "string",
                  },
                  {
                    components: [
                      { internalType: "uint256", name: "id", type: "uint256" },
                      { internalType: "string", name: "file", type: "string" },
                      {
                        internalType: "uint256",
                        name: "startLine",
                        type: "uint256",
                      },
                      {
                        internalType: "uint256",
                        name: "startCol",
                        type: "uint256",
                      },
                      {
                        internalType: "uint256",
                        name: "endLine",
                        type: "uint256",
                      },
                      {
                        internalType: "uint256",
                        name: "endCol",
                        type: "uint256",
                      },
                      {
                        internalType: "string",
                        name: "severity",
                        type: "string",
                      },
                      {
                        internalType: "string",
                        name: "message",
                        type: "string",
                      },
                      { internalType: "string", name: "code", type: "string" },
                      {
                        internalType: "uint256",
                        name: "scanId",
                        type: "uint256",
                      },
                    ],
                    internalType: "struct Vulnerability[]",
                    name: "result",
                    type: "tuple[]",
                  },
                  { internalType: "string", name: "updatedAt", type: "string" },
                ],
                internalType: "struct Scan[]",
                name: "",
                type: "tuple[]",
              },
            ],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [],
            name: "getRepoScansAll",
            outputs: [
              {
                components: [
                  { internalType: "uint256", name: "id", type: "uint256" },
                  { internalType: "string", name: "username", type: "string" },
                  {
                    internalType: "string",
                    name: "repositoryId",
                    type: "string",
                  },
                  {
                    components: [
                      { internalType: "uint256", name: "id", type: "uint256" },
                      { internalType: "string", name: "file", type: "string" },
                      {
                        internalType: "uint256",
                        name: "startLine",
                        type: "uint256",
                      },
                      {
                        internalType: "uint256",
                        name: "startCol",
                        type: "uint256",
                      },
                      {
                        internalType: "uint256",
                        name: "endLine",
                        type: "uint256",
                      },
                      {
                        internalType: "uint256",
                        name: "endCol",
                        type: "uint256",
                      },
                      {
                        internalType: "string",
                        name: "severity",
                        type: "string",
                      },
                      {
                        internalType: "string",
                        name: "message",
                        type: "string",
                      },
                      { internalType: "string", name: "code", type: "string" },
                      {
                        internalType: "uint256",
                        name: "scanId",
                        type: "uint256",
                      },
                    ],
                    internalType: "struct Vulnerability[]",
                    name: "result",
                    type: "tuple[]",
                  },
                  { internalType: "string", name: "updatedAt", type: "string" },
                ],
                internalType: "struct Scan[]",
                name: "",
                type: "tuple[]",
              },
            ],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [
              {
                components: [
                  {
                    internalType: "bytes32[]",
                    name: "merkleProof",
                    type: "bytes32[]",
                  },
                  {
                    components: [
                      {
                        internalType: "bytes32",
                        name: "attestationType",
                        type: "bytes32",
                      },
                      {
                        internalType: "bytes32",
                        name: "sourceId",
                        type: "bytes32",
                      },
                      {
                        internalType: "uint64",
                        name: "votingRound",
                        type: "uint64",
                      },
                      {
                        internalType: "uint64",
                        name: "lowestUsedTimestamp",
                        type: "uint64",
                      },
                      {
                        components: [
                          {
                            internalType: "string",
                            name: "url",
                            type: "string",
                          },
                          {
                            internalType: "string",
                            name: "postprocessJq",
                            type: "string",
                          },
                          {
                            internalType: "string",
                            name: "abi_signature",
                            type: "string",
                          },
                        ],
                        internalType: "struct IJsonApi.RequestBody",
                        name: "requestBody",
                        type: "tuple",
                      },
                      {
                        components: [
                          {
                            internalType: "bytes",
                            name: "abi_encoded_data",
                            type: "bytes",
                          },
                        ],
                        internalType: "struct IJsonApi.ResponseBody",
                        name: "responseBody",
                        type: "tuple",
                      },
                    ],
                    internalType: "struct IJsonApi.Response",
                    name: "data",
                    type: "tuple",
                  },
                ],
                internalType: "struct IJsonApi.Proof",
                name: "_proof",
                type: "tuple",
              },
            ],
            name: "isJsonApiProofValid",
            outputs: [{ internalType: "bool", name: "", type: "bool" }],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [
              { internalType: "string", name: "", type: "string" },
              { internalType: "uint256", name: "", type: "uint256" },
            ],
            name: "repoToScan",
            outputs: [
              { internalType: "uint256", name: "id", type: "uint256" },
              { internalType: "string", name: "username", type: "string" },
              { internalType: "string", name: "repositoryId", type: "string" },
              { internalType: "string", name: "updatedAt", type: "string" },
            ],
            stateMutability: "view",
            type: "function",
          },
        ],
        signer,
      );

      console.log(dataAndProof.proof, dataAndProof.response);

      toast({ description: "Submitting proof to contract..." });
      const tx = await vuln.addScans(
        {
          merkleProof: dataAndProof.proof,
          data: dataAndProof.response,
        },
        {
          gasLimit: ethers.toBigInt(1000000),
        },
      );
      await tx.wait();
      toast({ description: "Proof submitted successfully!" });
    } catch (error) {
      console.error("Error submitting proof:", error);
      toast({ description: "Error submitting proof. See console." });
    }
  };

  if (!walletAddress) {
    return (
      <Button
        onClick={connectWallet}
        disabled={walletAddress !== null}
        className="mt-4"
      >
        <LinkIcon size={16} /> Connect MetaMask
      </Button>
    );
  }

  return (
    <div>
      <p className="text-sm">Connected Wallet: {walletAddress}</p>
      <div className="mt-4 flex space-x-4">
        <Button onClick={submitRequest} disabled={isLoading}>
          {isLoading ? "Processing..." : "Upload Proof"}
        </Button>
        {roundId > 0 && (
          <>
            <Button>
              <Link
                href={`https://coston-systems-explorer.flare.rocks/voting-epoch/${roundId}`}
                target="_blank"
              >
                View Voting Round
              </Link>
            </Button>
            <Button>
              <Link
                href={`https://coston-explorer.flare.network/address/0x0be7904080F6c55766cfeF38147125535921E3Ed`}
                target="_blank"
              >
                View Smart Contract
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
