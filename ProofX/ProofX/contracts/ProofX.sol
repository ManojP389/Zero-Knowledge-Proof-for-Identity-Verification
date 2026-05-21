// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ProofX {
    struct Requirement {
        string rules;
        bool exists;
    }

    mapping(bytes32 => bytes32) public credentialHashes;
    mapping(uint256 => Requirement) public companyRequirements;
    event CredentialHashStored(bytes32 indexed userId, bytes32 hash);
    event RequirementSet(uint256 indexed companyId, string rules);
    event VerificationLogged(bytes32 indexed userId, uint256 indexed companyId, bool result);

    function storeCredentialHash(bytes32 userId, bytes32 hash) public {
        credentialHashes[userId] = hash;
        emit CredentialHashStored(userId, hash);
    }

    function setRequirements(uint256 companyId, string memory rules) public {
        companyRequirements[companyId] = Requirement({ rules: rules, exists: true });
        emit RequirementSet(companyId, rules);
    }

    function logVerification(bytes32 userId, uint256 companyId, bool result) public {
        emit VerificationLogged(userId, companyId, result);
    }
}
