const hre = require("hardhat");

async function main() {
  console.log("Deploying Universal Blockchain Platform contracts...");

  // Deploy DEX
  console.log("\n1. Deploying DEX...");
  const DEX = await hre.ethers.getContractFactory("DEX");
  const dex = await DEX.deploy();
  await dex.deployed();
  console.log("DEX deployed to:", dex.address);

  // Deploy NFT Asset Tokenization
  console.log("\n2. Deploying NFTAsset...");
  const NFTAsset = await hre.ethers.getContractFactory("NFTAsset");
  const nftAsset = await NFTAsset.deploy();
  await nftAsset.deployed();
  console.log("NFTAsset deployed to:", nftAsset.address);

  // Deploy Fungible Asset Tokenization
  console.log("\n3. Deploying FungibleAsset...");
  const FungibleAsset = await hre.ethers.getContractFactory("FungibleAsset");
  const fungibleAsset = await FungibleAsset.deploy();
  await fungibleAsset.deployed();
  console.log("FungibleAsset deployed to:", fungibleAsset.address);

  // Deploy Payment Gateway
  console.log("\n4. Deploying PaymentGateway...");
  const PaymentGateway = await hre.ethers.getContractFactory("PaymentGateway");
  const paymentGateway = await PaymentGateway.deploy();
  await paymentGateway.deployed();
  console.log("PaymentGateway deployed to:", paymentGateway.address);

  // Deploy Decentralized Wallet
  console.log("\n5. Deploying DecentralizedWallet...");
  const DecentralizedWallet = await hre.ethers.getContractFactory("DecentralizedWallet");
  const wallet = await DecentralizedWallet.deploy();
  await wallet.deployed();
  console.log("DecentralizedWallet deployed to:", wallet.address);

  // Save deployment addresses
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    contracts: {
      DEX: dex.address,
      NFTAsset: nftAsset.address,
      FungibleAsset: fungibleAsset.address,
      PaymentGateway: paymentGateway.address,
      DecentralizedWallet: wallet.address
    }
  };

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = require("fs");
  const path = require("path");
  const deploymentsDir = path.join(__dirname, "../deployments");
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    path.join(deploymentsDir, `${hre.network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\nDeployment info saved to deployments/" + hre.network.name + ".json");

  // Verify contracts if on a public network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nWaiting for block confirmations...");
    await dex.deployTransaction.wait(5);
    
    console.log("\nVerifying contracts on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: dex.address,
        constructorArguments: []
      });
    } catch (error) {
      console.log("Error verifying DEX:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
