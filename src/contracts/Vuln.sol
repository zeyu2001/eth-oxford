// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston/ContractRegistry.sol";
import {IFdcHub} from "@flarenetwork/flare-periphery-contracts/coston/IFdcHub.sol";
import {IFdcRequestFeeConfigurations} from "@flarenetwork/flare-periphery-contracts/coston/IFdcRequestFeeConfigurations.sol";
import {IJsonApiVerification} from "@flarenetwork/flare-periphery-contracts/coston/IJsonApiVerification.sol";
import {IJsonApi} from "@flarenetwork/flare-periphery-contracts/coston/IJsonApi.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

struct Vulnerability {
    uint256 id;
    string file;
    uint256 startLine;
    uint256 startCol;
    uint256 endLine;
    uint256 endCol;
    string severity;
    string message;
    string code;
    uint256 scanId;
}

struct Scan {
    uint256 id;
    string username;
    string repositoryId;
    Vulnerability[] result;
    string updatedAt;
}

contract Vuln {
    mapping(string => Scan[]) public repoToScan;
    string[] public allRepos;

    function isJsonApiProofValid(
        IJsonApi.Proof calldata _proof
    ) public view returns (bool) {
        return
            ContractRegistry.auxiliaryGetIJsonApiVerification().verifyJsonApi(
                _proof
            );
    }
    function addScans(IJsonApi.Proof calldata data) public {
        // verify proof
        // require(isJsonApiProofValid(data), "Invalid proof");

        // decode the data into our DTO
        Scan memory dto = abi.decode(
            data.data.responseBody.abi_encoded_data,
            (Scan)
        );

        // Ensure repoName exists in the allRepos array
        if (repoToScan[dto.repositoryId].length == 0) {
            allRepos.push(dto.repositoryId);
        }

        // Create a new Scan object in storage
        Scan storage newScan = repoToScan[dto.repositoryId].push();

        // Manually copy the values from memory `dto` to the new `Scan` in storage
        newScan.id = dto.id;
        newScan.username = dto.username;
        newScan.repositoryId = dto.repositoryId;
        newScan.updatedAt = dto.updatedAt;

        // Loop through the vulnerabilities and manually copy them from memory to storage
        for (uint256 i = 0; i < dto.result.length; i++) {
            Vulnerability storage newVulnerability = newScan.result.push();
            newVulnerability.id = dto.result[i].id;
            newVulnerability.file = dto.result[i].file;
            newVulnerability.startLine = dto.result[i].startLine;
            newVulnerability.startCol = dto.result[i].startCol;
            newVulnerability.endLine = dto.result[i].endLine;
            newVulnerability.endCol = dto.result[i].endCol;
            newVulnerability.severity = dto.result[i].severity;
            newVulnerability.message = dto.result[i].message;
            newVulnerability.code = dto.result[i].code;
            newVulnerability.scanId = dto.result[i].scanId;
        }
    }

    function getRepoScans(
        string calldata repositoryId
    ) external view returns (Scan[] memory) {
        return repoToScan[repositoryId];
    }

     function getRepoScansAll() external view returns (Scan[] memory) {
        uint256 totalScans = 0;
        // Calculate the total number of scans for all repositories
        for (uint256 i = 0; i < allRepos.length; i++) {
            totalScans += repoToScan[allRepos[i]].length;
        }
        Scan[] memory allScanResults = new Scan[](totalScans);
        uint256 index = 0;
        for (uint256 i = 0; i < allRepos.length; i++) {
            Scan[] memory scansForRepo = repoToScan[allRepos[i]];
            for (uint256 j = 0; j < scansForRepo.length; j++) {
                allScanResults[index] = scansForRepo[j];
                index++;
            }
        }
        return allScanResults;
    }
     
    function getAllRepos() external view returns (string[] memory) {
        return allRepos;
    }

    function getFdcHub() external view returns (IFdcHub) {
        return ContractRegistry.getFdcHub();
    }

    function getFdcRequestFeeConfigurations()
        external
        view
        returns (IFdcRequestFeeConfigurations)
    {
        return ContractRegistry.getFdcRequestFeeConfigurations();
    }
}
