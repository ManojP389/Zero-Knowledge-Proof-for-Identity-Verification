const hre = require("hardhat");

async function main() {
  console.log("Deploying ProofXCredentialManager to", hre.network.name);
  
  const ProofXCredentialManager = await hre.ethers.getContractFactory(
    "ProofXCredentialManager"
  );
  
  const contract = await ProofXCredentialManager.deploy();
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  
  console.log("ProofXCredentialManager deployed to:", address);
  
  // Save deployment address
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: address,
    deploymentTime: new Date().toISOString(),
  };
  
  fs.writeFileSync(
    "./deployment-address.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("Deployment info saved to deployment-address.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });