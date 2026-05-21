const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ProofXCredentialManager", function () {
  let contract;
  let owner;
  let user;
  let company;

  beforeEach(async function () {
    [owner, user, company] = await ethers.getSigners();
    
    const ProofXCredentialManager = await ethers.getContractFactory(
      "ProofXCredentialManager"
    );
    
    contract = await ProofXCredentialManager.deploy();
    await contract.waitForDeployment();
  });

  describe("Credential Management", function () {
    it("Should store credential hash for a user", async function () {
      const userId = ethers.keccak256(ethers.toUtf8Bytes("user123"));
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("credential_data"));
      
      await contract.storeCredentialHash(userId, credentialHash);
      
      const [storedHash, timestamp] = await contract.getCredentialHash(userId);
      expect(storedHash).to.equal(credentialHash);
      expect(timestamp).to.be.gt(0);
    });

    it("Should check if credential exists", async function () {
      const userId = ethers.keccak256(ethers.toUtf8Bytes("user456"));
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("credential_data"));
      
      expect(await contract.hasCredential(userId)).to.be.false;
      
      await contract.storeCredentialHash(userId, credentialHash);
      
      expect(await contract.hasCredential(userId)).to.be.true;
    });

    it("Should revert for invalid userId", async function () {
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("credential_data"));
      
      await expect(
        contract.storeCredentialHash(ethers.ZeroHash, credentialHash)
      ).to.be.revertedWith("Invalid userId");
    });
  });

  describe("Company Requirements", function () {
    it("Should set company requirements", async function () {
      const requirements = JSON.stringify({
        minAge: 18,
        degree: "B.Tech"
      });
      
      const tx = await contract.setRequirements(requirements);
      const receipt = await tx.wait();
      
      // Company ID should be 1
      const [companyId, storedRequirements, companyOwner, timestamp] = 
        await contract.getCompanyDetails(1);
      
      expect(companyId).to.equal(1);
      expect(storedRequirements).to.equal(requirements);
      expect(companyOwner).to.equal(owner.address);
    });

    it("Should update company requirements", async function () {
      const initialRequirements = JSON.stringify({ minAge: 18 });
      const updatedRequirements = JSON.stringify({ minAge: 21, degree: "B.Tech" });
      
      await contract.setRequirements(initialRequirements);
      await contract.updateRequirements(1, updatedRequirements);
      
      const [, storedRequirements] = await contract.getCompanyDetails(1);
      expect(storedRequirements).to.equal(updatedRequirements);
    });

    it("Should get requirements by company ID", async function () {
      const requirements = 'age>=18,degree=B.Tech';
      
      await contract.connect(company).setRequirements(requirements);
      
      const storedRequirements = await contract.getRequirements(1);
      expect(storedRequirements).to.equal(requirements);
    });
  });

  describe("Verification Logging", function () {
    it("Should log verification result", async function () {
      const userId = ethers.keccak256(ethers.toUtf8Bytes("user789"));
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("credential_data"));
      const requirements = '{"minAge": 18}';
      
      await contract.storeCredentialHash(userId, credentialHash);
      await contract.setRequirements(requirements);
      
      await contract.logVerification(userId, 1, true);
      
      const logs = await contract.getVerificationLogs(userId);
      expect(logs.length).to.equal(1);
      expect(logs[0].result).to.be.true;
      expect(logs[0].companyId).to.equal(1);
    });

    it("Should emit VerificationLogged event", async function () {
      const userId = ethers.keccak256(ethers.toUtf8Bytes("user999"));
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("credential_data"));
      const requirements = '{"minAge": 18}';
      
      await contract.storeCredentialHash(userId, credentialHash);
      await contract.setRequirements(requirements);
      
      await expect(contract.logVerification(userId, 1, true))
        .to.emit(contract, "VerificationLogged")
        .withArgs(userId, 1, true, await ethers.provider.getBlock('latest').then(b => b.timestamp));
    });
  });

  describe("Proof Verification", function () {
    it("Should verify proof hash", async function () {
      const userId = ethers.keccak256(ethers.toUtf8Bytes("user111"));
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("credential_data"));
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("proof_data"));
      
      await contract.storeCredentialHash(userId, credentialHash);
      
      await expect(contract.verifyProofHash(userId, proofHash))
        .to.emit(contract, "ProofVerified");
    });

    it("Should revert for non-existent credential", async function () {
      const userId = ethers.keccak256(ethers.toUtf8Bytes("nonexistent"));
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("proof_data"));
      
      await expect(
        contract.verifyProofHash(userId, proofHash)
      ).to.be.revertedWith("Credential does not exist");
    });
  });
});