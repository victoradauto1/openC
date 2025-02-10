import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("NFT Collection", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const NFTMarket = await hre.ethers.getContractFactory("NFTMarket");
    const nftMarket = await NFTMarket.deploy();

    const NFTCollection = await hre.ethers.getContractFactory("NFTCollection");
    const nftCollection = await NFTCollection.deploy(nftMarket.getAddress());


    return { nftCollection, owner, otherAccount, marketAddress: nftMarket.getAddress()};
  }

  describe("Deployment", function () {
    it("Should mint a token", async function () {
      const { nftCollection } = await loadFixture(deployFixture);

      await nftCollection.mint("metadata uri");
      expect(await nftCollection.tokenURI(1)).to.equal("metadata uri");
    });

    it("Can change approval", async function () {
      const { nftCollection, owner, otherAccount} = await loadFixture(deployFixture);

      const instance = nftCollection.connect(otherAccount);
      await instance.mint("metadata uri");
  
      await instance.setApprovalForAll(owner,false);

      expect(await nftCollection.isApprovedForAll(otherAccount, owner)).to.equal(false);
    });

    it("Cannot change approval", async function () {
      const { nftCollection, owner, otherAccount, marketAddress} = await loadFixture(deployFixture);

      const instance = nftCollection.connect(otherAccount);
      await instance.mint("metadata uri");


      await expect(instance.setApprovalForAll(marketAddress, false)).to.be.revertedWith("Cannot remove marketplace approval");
    });

  });
});
