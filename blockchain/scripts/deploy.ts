import { ethers } from "hardhat";

async function main() {
  const NFTMarket = await ethers.getContractFactory("NFTMarket");
  const nftMarket = await NFTMarket.deploy();

  await nftMarket.waitForDeployment();


  const marketAddress = await nftMarket.getAddress();
  console.log(`Contract deployed at ${marketAddress}`);

  const NFTCollection = await ethers.getContractFactory("NFTCollection");
  const nftCollection = await NFTCollection.deploy(marketAddress);

  await nftCollection.waitForDeployment();

  console.log(`COntract deployed at ${await nftCollection.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
