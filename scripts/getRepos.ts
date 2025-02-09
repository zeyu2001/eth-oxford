/* eslint-disable */
// @ts-nocheck
import { artifacts, ethers } from "hardhat";

async function main() {
  // Replace with your actual contract artifact name
  const VULN_CONTRACT_ADDRESS = "0x0be7904080F6c55766cfeF38147125535921E3Ed"; // Replace with actual address
  
  const Vuln = artifacts.require("Vuln");
  const vuln = await Vuln.at(VULN_CONTRACT_ADDRESS);

  const repoScans = await vuln.getRepoScansAll();

  console.log("🔹 all Repo Scans:", repoScans);

  const allRepos = await vuln.getAllRepos();

  console.log("All Repos" + allRepos); 


  //   const Vuln = artifacts.require("Vuln");

//   const vuln: VulnInstance = await Vuln.new();
//   console.log("Vuln contract deployed at:", vuln.address);

//   // Optionally verify on block explorer
//   const result = await run("verify:verify", {
//     address: vuln.address,
//     constructorArguments: [],
//   });
//   console.log("Verification result:", result);
}

main();
