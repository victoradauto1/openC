import {
    loadFixture
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
  import { expect } from "chai";
  import hre, { ethers } from "hardhat";
  
  describe("NFT Market", function () {
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
  
  
      return {nftMarket, nftCollection, owner, otherAccount};
    }
  
    describe("Deployment", function () {
      it("Should fetch items", async function () {
        const { nftMarket, nftCollection, owner, otherAccount } = await loadFixture(deployFixture);
  
        const listingPrice = (await nftMarket.listingPrice()).toString();
        const auctionPrice = ethers.parseUnits("1", "ether");

        await nftCollection.mint("metadata uri");
        await nftMarket.createMarketItem(nftCollection.getAddress(), 1, auctionPrice, {value: listingPrice});
        const marketItems = await nftMarket.fetchMarketItems();
        
        expect(marketItems.length).to.equal(1);
      });

      it("Should fetch my items", async function () {
        const { nftMarket, nftCollection, owner, otherAccount } = await loadFixture(deployFixture);
  
        const listingPrice = (await nftMarket.listingPrice()).toString();
        const auctionPrice = ethers.parseUnits("1", "ether");

        await nftCollection.mint("metadata uri");
        await nftCollection.mint("metadata uri 2");

        await nftMarket.createMarketItem(nftCollection.getAddress(), 1, auctionPrice, {value: listingPrice});
        await nftMarket.createMarketItem(nftCollection.getAddress(), 2, auctionPrice, {value: listingPrice});

        const instance =  nftMarket.connect(otherAccount);

        await instance.createMarketSale(nftCollection, 2, { value: auctionPrice});

        const myNFTs = await instance.fetchMyNtfs()
        
        expect(myNFTs.length).to.equal(1);
        expect(myNFTs[0].itemId).to.equal(2);
      });

      it("Should fetch my created items", async function () {
        const { nftMarket, nftCollection, owner, otherAccount } = await loadFixture(deployFixture);
  
        const listingPrice = (await nftMarket.listingPrice()).toString();
        const auctionPrice = ethers.parseUnits("1", "ether");

        await nftCollection.mint("metadata uri");
        await nftCollection.mint("metadata uri 2");

        await nftMarket.createMarketItem(nftCollection.getAddress(), 1, auctionPrice, {value: listingPrice});
        await nftMarket.createMarketItem(nftCollection.getAddress(), 2, auctionPrice, {value: listingPrice});

        const myCreatedItems = await nftMarket.fetchItemsCreated()
        
        expect(myCreatedItems.length).to.equal(2);
      });

      it("Should create and execute markent sale", async function () {
        const { nftMarket, nftCollection, owner, otherAccount } = await loadFixture(deployFixture);
  
        const listingPrice = (await nftMarket.listingPrice()).toString();
        const auctionPrice = ethers.parseUnits("1", "ether");

        await nftCollection.mint("metadata uri");

        await nftMarket.createMarketItem(nftCollection.getAddress(), 1, auctionPrice, {value: listingPrice});

        const instance =  nftMarket.connect(otherAccount);

        await instance.createMarketSale(nftCollection, 1, { value: auctionPrice});

        const nftOwner = await nftCollection.ownerOf(1);
        const marketItems = await nftMarket.fetchMarketItems();

        expect(nftOwner).to.equal(otherAccount);
        expect(marketItems.length).to.equal(0);
      });
    });
  });
  