/* eslint-disable */
// @ts-nocheck
import { artifacts, ethers } from "hardhat";

async function main() {
  // Replace with your actual contract artifact name
  const Vuln = artifacts.require("Vuln");

  const vuln: VulnInstance = await Vuln.new();
  console.log("Vuln contract deployed at:", vuln.address);

  // Optionally verify on block explorer
  const result = await run("verify:verify", {
    address: vuln.address,
    constructorArguments: [],
  });
  console.log("Verification result:", result);
}

main();
