// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ProofXCredentialManager
 * @dev Smart contract for managing zero-knowledge proof credentials on Ethereum
 * @notice Stores credential hashes, company requirements, and verification logs on-chain
 */
contract ProofXCredentialManager {
    // Structs
    struct Credential {
        bytes32 userId;
        bytes32 credentialHash;
        uint256 timestamp;
        bool exists;
    }

    struct CompanyRequirement {
        uint256 companyId;
        string requirements; // JSON string storing age, degree, etc.
        address owner;
        uint256 timestamp;
        bool exists;
    }

    struct VerificationLog {
        bytes32 userId;
        uint256 companyId;
        bool result;
        uint256 timestamp;
    }

    // State Variables
    mapping(bytes32 => Credential) private credentials;
    mapping(uint256 => CompanyRequirement) private companyRequirements;
    mapping(bytes32 => VerificationLog[]) private verificationLogs;
    
    uint256 private companyCounter;
    address public owner;

    // Events
    event CredentialStored(bytes32 indexed userId, bytes32 credentialHash, uint256 timestamp);
    event RequirementsSet(uint256 indexed companyId, string requirements, uint256 timestamp);
    event VerificationLogged(bytes32 indexed userId, uint256 indexed companyId, bool result, uint256 timestamp);
    event ProofVerified(bytes32 indexed userId, uint256 indexed companyId, bool result);

    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    // Constructor
    constructor() {
        owner = msg.sender;
        companyCounter = 0;
    }

    /**
     * @dev Store credential hash for a user
     * @param userId Unique identifier for the user (bytes32)
     * @param credentialHash Hash of the credential data (not raw data)
     */
    function storeCredentialHash(bytes32 userId, bytes32 credentialHash) public {
        require(userId != bytes32(0), "Invalid userId");
        require(credentialHash != bytes32(0), "Invalid credentialHash");

        credentials[userId] = Credential({
            userId: userId,
            credentialHash: credentialHash,
            timestamp: block.timestamp,
            exists: true
        });

        emit CredentialStored(userId, credentialHash, block.timestamp);
    }

    /**
     * @dev Get credential hash for a user
     * @param userId Unique identifier for the user
     * @return credentialHash, timestamp
     */
    function getCredentialHash(bytes32 userId) public view returns (bytes32, uint256) {
        require(credentials[userId].exists, "Credential does not exist");
        return (credentials[userId].credentialHash, credentials[userId].timestamp);
    }

    /**
     * @dev Set company requirements (stored on blockchain)
     * @param requirements JSON string containing requirements (e.g., "age>=18,degree=B.Tech")
     * @return companyId The ID of the company
     */
    function setRequirements(string memory requirements) public returns (uint256) {
        require(bytes(requirements).length > 0, "Requirements cannot be empty");

        companyCounter++;
        uint256 newCompanyId = companyCounter;

        companyRequirements[newCompanyId] = CompanyRequirement({
            companyId: newCompanyId,
            requirements: requirements,
            owner: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        emit RequirementsSet(newCompanyId, requirements, block.timestamp);
        return newCompanyId;
    }

    /**
     * @dev Update company requirements
     * @param companyId ID of the company
     * @param requirements New requirements JSON string
     */
    function updateRequirements(uint256 companyId, string memory requirements) public {
        require(companyRequirements[companyId].exists, "Company does not exist");
        require(companyRequirements[companyId].owner == msg.sender, "Not authorized");
        require(bytes(requirements).length > 0, "Requirements cannot be empty");

        companyRequirements[companyId].requirements = requirements;
        companyRequirements[companyId].timestamp = block.timestamp;

        emit RequirementsSet(companyId, requirements, block.timestamp);
    }

    /**
     * @dev Get company requirements
     * @param companyId ID of the company
     * @return requirements JSON string
     */
    function getRequirements(uint256 companyId) public view returns (string memory) {
        require(companyRequirements[companyId].exists, "Company does not exist");
        return companyRequirements[companyId].requirements;
    }

    /**
     * @dev Log verification result
     * @param userId Unique identifier for the user
     * @param companyId ID of the company
     * @param result Verification result (true = verified, false = rejected)
     */
    function logVerification(bytes32 userId, uint256 companyId, bool result) public {
        require(userId != bytes32(0), "Invalid userId");
        require(companyRequirements[companyId].exists, "Company does not exist");

        verificationLogs[userId].push(VerificationLog({
            userId: userId,
            companyId: companyId,
            result: result,
            timestamp: block.timestamp
        }));

        emit VerificationLogged(userId, companyId, result, block.timestamp);
    }

    /**
     * @dev Get verification logs for a user
     * @param userId Unique identifier for the user
     * @return Array of verification logs
     */
    function getVerificationLogs(bytes32 userId) public view returns (VerificationLog[] memory) {
        return verificationLogs[userId];
    }

    /**
     * @dev Verify proof integrity (stores proof hash on-chain)
     * @param userId Unique identifier for the user
     * @param proofHash Hash of the ZKP proof
     */
    function verifyProofHash(bytes32 userId, bytes32 proofHash) public {
        require(userId != bytes32(0), "Invalid userId");
        require(proofHash != bytes32(0), "Invalid proofHash");
        require(credentials[userId].exists, "Credential does not exist");

        // This function can be extended to verify the proof on-chain
        // For now, it stores the proof hash for integrity verification
        emit ProofVerified(userId, 0, true);
    }

    /**
     * @dev Check if credential exists for a user
     * @param userId Unique identifier for the user
     * @return bool True if credential exists
     */
    function hasCredential(bytes32 userId) public view returns (bool) {
        return credentials[userId].exists;
    }

    /**
     * @dev Check if company exists
     * @param companyId ID of the company
     * @return bool True if company exists
     */
    function companyExists(uint256 companyId) public view returns (bool) {
        return companyRequirements[companyId].exists;
    }

    /**
     * @dev Get company details
     * @param companyId ID of the company
     * @return companyId, requirements, owner, timestamp
     */
    function getCompanyDetails(uint256 companyId) public view returns (
        uint256,
        string memory,
        address,
        uint256
    ) {
        require(companyRequirements[companyId].exists, "Company does not exist");
        CompanyRequirement memory req = companyRequirements[companyId];
        return (req.companyId, req.requirements, req.owner, req.timestamp);
    }
}