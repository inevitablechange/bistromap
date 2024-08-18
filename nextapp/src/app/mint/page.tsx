"use client";

import React, { useState } from "react";
import { ethers } from "ethers";
import BannerNFT from "../../../../solidity/artifacts/contracts/BannerNFT.sol/BannerNFT.json";
import BSMToken from "../../../../solidity/artifacts/contracts/BsmToken.sol/BSM.json";
import axios from "axios";

const bannerNFTAddress = "0x1ce31b93380D1cD249312b7b64e7BD9A4A218FeF";
const bsmTokenAddress = "0x79Ae9522a82d9c30159B18C6831d6540F68811fB";

const NFT_PRICE = ethers.parseUnits("2000", 18); // 2000 BSM, 18 decimals

const PinataUploadUrl = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const PinataJsonUrl = "https://api.pinata.cloud/pinning/pinJSONToIPFS";
const PinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY || "";
const PinataSecretApiKey = process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY || "";

const MintPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState<string>("");

  // MetaMask 연결
  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Error connecting MetaMask", error);
      }
    } else {
      alert("MetaMask is not installed.");
    }
  };

  // 파일 변경 핸들링
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // 파일을 IPFS에 업로드
  const uploadToIPFS = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(PinataUploadUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "pinata-api-key": PinataApiKey,
          "pinata-secret-api-key": PinataSecretApiKey,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
        },
      });

      const ipfsHash = response.data.IpfsHash;
      return `https://ipfs.io/ipfs/${ipfsHash}`;
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      throw error;
    }
  };

  // 메타데이터 생성 및 IPFS 업로드
  const createMetadata = async (imageUrl: string): Promise<string> => {
    const metadata = {
      name: "Banner",
      description: description, // 링크가 저장될 필드
      image: imageUrl,
      attributes: [],
    };

    try {
      const response = await axios.post(PinataJsonUrl, metadata, {
        headers: {
          "Content-Type": "application/json",
          "pinata-api-key": PinataApiKey,
          "pinata-secret-api-key": PinataSecretApiKey,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
        },
      });

      const ipfsHash = response.data.IpfsHash;
      return `https://ipfs.io/ipfs/${ipfsHash}`;
    } catch (error) {
      console.error("Error creating metadata:", error);
      throw error;
    }
  };

  // NFT 민팅
  const handleMint = async () => {
    if (!account) {
      alert("Please connect to MetaMask first.");
      return;
    }

    if (!window.ethereum) {
      alert("MetaMask is not installed.");
      return;
    }

    if (!file) {
      alert("Please upload a file first.");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const nftContract = new ethers.Contract(
      bannerNFTAddress,
      BannerNFT.abi,
      signer
    );
    const bsmContract = new ethers.Contract(
      bsmTokenAddress,
      BSMToken.abi,
      signer
    );

    try {
      setLoading(true);

      // 파일을 IPFS에 업로드
      const imageUrl = await uploadToIPFS(file);

      // 메타데이터 생성 및 IPFS 업로드
      const metadataUrl = await createMetadata(imageUrl);

      // NFT 민팅을 위한 승인 처리
      const allowance = await bsmContract.allowance(account, bannerNFTAddress);
      const allowanceValue = allowance.toString();

      if (
        parseFloat(allowanceValue) <
        parseFloat(ethers.formatUnits(NFT_PRICE, 18))
      ) {
        const approveTx = await bsmContract.approve(
          bannerNFTAddress,
          NFT_PRICE
        );
        await approveTx.wait();
      }

      // NFT 민팅
      const tx = await nftContract.mintNFT(metadataUrl);
      await tx.wait();

      alert("NFT has been minted successfully!");

      // 상태 초기화
      setFile(null);
      setDescription("");
    } catch (error) {
      if (error instanceof Error) {
        alert(`Failed to mint NFT: ${error.message}`);
      } else {
        alert("Failed to mint NFT: Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mint-container">
      <h1>Mint Your NFT</h1>
      <p>Click the button below to mint your NFT.</p>
      {account ? (
        <div className="mint-controls">
          <input type="file" onChange={handleFileChange} />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter the link"
          />
          <button onClick={handleMint} disabled={loading} className="btn">
            {loading ? "Minting..." : "Mint NFT"}
          </button>
        </div>
      ) : (
        <button onClick={connectMetaMask} disabled={loading} className="btn">
          Connect to MetaMask
        </button>
      )}
    </div>
  );
};

export default MintPage;
