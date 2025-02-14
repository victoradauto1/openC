import axios from "axios";
import { ethers } from "ethers";
import NFTMarketABI from "./NFTMarketABI.json";
import NFTCollection from "./NFTCollection.json";
import { metadata } from "@/app/layout";
import { JsonRpcProvider } from "ethers";
import { Contract } from "ethers";
import { EventLog } from "ethers";
import { EthersError } from "ethers";
import { collectMeta } from "next/dist/build/utils";

const MARKETPLACE_ADDRESS=`${process.env.MARKETPLACE_ADDRESS}`;
const COLLECTION_ADDRESS=`${process.env.COLLECTION_ADDRESS}`;
const CHAIN_ID= `${process.env.CHAIN_ID}`;

export type newNFT = {
    name?:string;
    description?: string;
    price?: string;
    image?: File | null;
}

async function uploadFile(file:File): Promise<string>{
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios({
        method:"POST",
        url:"/pinata/file",
        data: formData,
        headers:{
            "Content-type":"multipart/form-data"
        }
    });

    return `${response.data.uri}`;
}

type Metadata={
    name?: string;
    description?: string;
    image?: string;
}

async function uploadMetadata(metadata: Metadata): Promise<string>{
    const response = await axios({
        method:"POST",
        url:"/pinata/metadata",
        data: metadata,
        headers:{
            "Content-type":"application/json"
        }
    });

    return `${response.data.uri}`;
}

async function getProvider(){
    if(!window.ethereum) throw new Error("Wallet not found!")
    
    const provider = new ethers.BrowserProvider(window.ethereum);

    const accounts:string[] = await provider.send("eth_requestAccounts", []);

    if(!accounts || !accounts.length) throw new Error("Wallet not permitted!");

    await provider.send("Wallet_switchEthereumChain", [{
        chainId: ethers.toBeHex(CHAIN_ID)
    }]);

    return provider;
}

async function createItem(url: string, price: string): Promise<number>{
    const provider = await getProvider();
    const signer = await provider.getSigner();
    
    //mint NFT
    const collectionContract = new ethers.Contract(COLLECTION_ADDRESS, NFTCollection, signer);
    const mintTx = await collectionContract.mint(url);
    const mintTxReceipt: ethers.ContractTransactionReceipt = await mintTx.wait();
    let eventLog = mintTxReceipt.logs[0] as EventLog;
    const tokenId  = Number(eventLog.args[2]);

    //create market item
    const weiPrice = ethers.parseUnits(price, "ether");
    const marketContract = new ethers.Contract(MARKETPLACE_ADDRESS, NFTMarketABI, signer);
    const listingPrice = (await marketContract.listingPrice()).toString();
    const createTx= await marketContract.createMarketItem(COLLECTION_ADDRESS,tokenId, weiPrice, {value: listingPrice} );
    const createTxReceipt: ethers.ContractTransactionReceipt = await createTx();
    eventLog = createTxReceipt.logs.find(l => (l as EventLog).eventName === "MarketItemCreated") as EventLog;
    const itemId = Number(eventLog.args[0]);

    return itemId;
    
}

export type NFT={
    itemId: number;
    tokenId: number;
    price: bigint | string;
    seller: string;
    owner: string;
    image: string;
    name: string;
    description: string;
}

export async function loadDetails(itemId: number): Promise<NFT>{
    const provider = await getProvider();
    const marketContract = new ethers.Contract(MARKETPLACE_ADDRESS, NFTMarketABI, provider);
    const collectionContract = new ethers.Contract(COLLECTION_ADDRESS, NFTCollection, provider);

    const item: NFT = await marketContract.marketItems(itemId);
    if(!item) return {} as NFT;

    const tokenUri  =  await collectionContract.tokenURI(item.tokenId);
    const metadata = await axios.get(tokenUri.replace("ipfs://", "htpps://gateway.pinata.cloud/ipfs/"));
    const price = ethers.formatUnits(item.price.toString(), "ether");

    return {
        itemId: item.itemId,
        tokenId: item.tokenId,
        price,
        seller: item.seller,
        owner: item.owner,
        image: metadata.data.image.replace("ipfs://", "htpps://gateway.pinata.cloud/ipfs/"),
        name: metadata.data.name,
        description: metadata.data.description
    } as NFT;
}

export async function buyNft(nft: NFT){
    const provider = await getProvider();
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(MARKETPLACE_ADDRESS,  NFTMarketABI, signer);
    const price = ethers.parseUnits(nft.price.toString(), "ethers");

    const tx = await contract.createMarketSale(COLLECTION_ADDRESS, nft.itemId, {value: price});
    await tx.wait();
}

export async function uploadAndCreate(nft: newNFT):Promise<number>{
    if(!nft.name || !nft.description || !nft.price || !nft.image) throw new Error("All fields are required");

    const uri = await uploadFile(nft.image)
    
    const metadataUri =  await uploadMetadata({name: nft.name, description: nft.description, image: uri});

    const itemId = await createItem(metadataUri, nft.price)

    return itemId;
}

export async function loadMyNFTs(): Promise<NFT[]>{
    const provider = await getProvider();
    const signer = await provider.getSigner();

    const marketContract = new ethers.Contract(MARKETPLACE_ADDRESS,  NFTMarketABI, provider);
    const collectionContract =new ethers.Contract(COLLECTION_ADDRESS,  NFTCollection, provider);

    const data = await marketContract.fetchMyNFTs({from: signer.address });
    if(!data || !data.length) return [];

    const items = await Promise.all(data.map(async (item:NFT)=> {
        const tokenUri = await collectionContract.tokenURI(item.tokenId);
        const metadata = await axios.get(tokenUri.replace("ipfs://", "htpps://gateway.pinata.cloud/ipfs/"));
        const price = ethers.formatUnits(item.price.toString(), "ether");

        return{
            price,
            itemId: item.itemId,
            tokenId: item.tokenId,
            seller: item.seller,
            owner: item.owner,
            image: metadata.data.image.replace("ipfs://", "htpps://gateway.pinata.cloud/ipfs/"),
            name: metadata.data.name,
            description: metadata.data.descripiton
        } as NFT
    }))

    return items;
}

export async function loadNFTs(): Promise<NFT[]>{
    const provider = await getProvider();

    const marketContract = new ethers.Contract(MARKETPLACE_ADDRESS,  NFTMarketABI, provider);
    const collectionContract =new ethers.Contract(COLLECTION_ADDRESS,  NFTCollection, provider);

    const data = await marketContract.fetchMarketItems();
    if(!data || !data.length) return [];

    const items = await Promise.all(data.map(async (item:NFT)=> {
        const tokenUri = await collectionContract.tokenURI(item.tokenId);
        const metadata = await axios.get(tokenUri.replace("ipfs://", "htpps://gateway.pinata.cloud/ipfs/"));
        const price = ethers.formatUnits(item.price.toString(), "ether");

        return{
            price,
            itemId: item.itemId,
            tokenId: item.tokenId,
            seller: item.seller,
            owner: item.owner,
            image: metadata.data.image.replace("ipfs://", "htpps://gateway.pinata.cloud/ipfs/"),
            name: metadata.data.name,
            description: metadata.data.descripiton
        } as NFT
    }))

    return items;
}
