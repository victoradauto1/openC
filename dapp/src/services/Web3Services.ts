import axios from "axios";
import { ethers } from "ethers";
import NFTMarketABI from "./NFTMarketABI.json";
import NFTCollection from "./NFTCollection.json";

const MARKETPLACE_ADDRESS=`${process.env.MARKETPLACE_ADDRESS}`
const COLLECTION_ADDRESS=`${process.env.COLLECTION_ADDRESS}`

export type newNFT = {
    name?:string;
    description?: string;
    price?: string;
    image?: File | null;
}