"use client";

import Card from "@/components/card";
import Header from "@/components/Header";
import { loadMyNFTs, NFT } from "@/services/Web3Services";
import { useEffect, useState } from "react";

export default function Account() {
  const [nfts, setNfts] = useState<NFT[]>([]);

  useEffect(() => {
    loadMyNFTs()
      .then((nfts) => setNfts(nfts))
      .catch((err) => alert(err.message));
  }, []);
  return (
    <>
      <main>
        <section className="bg-secondary-500 poster pt-4 relative text-opacity-60 text-white sm:px-4">
          <Header />
        </section>
        <div className="-mx-3 flex flex-wrap gap-y-6 justify-center mb-12">
          {nfts && nfts.length ? (
            nfts.map((nft) => <Card nft={nft} sold={true} />)
          ) : (
            <>"No NFTs found for this user"</>
          )}
        </div>
      </main>
    </>
  );
}
