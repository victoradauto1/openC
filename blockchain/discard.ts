import { ethers } from "hardhat";
//import ABI from "./ABI.json";
import {Contract, Transaction} from "ethers";

const CONTRACT_ADDRESS:string = `${process.env.CONTRACT_ADDRESS}`;
const CHAIN_ID: number = parseInt(`${process.env.CHAIN_ID}`)

export async function doLogin(){
    if(!window.ethereum) throw new Error ("Wallet not found!");// verifica se existe o obejto window nio brwnser
}