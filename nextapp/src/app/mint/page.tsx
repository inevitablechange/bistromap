"use client";

import React, { useState } from "react";
import { ethers } from "ethers";
import BannerNFT from "../../../../solidity/artifacts/contracts/BannerNFT.sol/BannerNFT.json";
import BSMToken from "../../../../solidity/artifacts/contracts/BsmToken.sol/BSM.json";
import axios from "axios";

const bannerNFTAddress = "0xc0037dA136ae1c1367B34eaADfBEb25aCc1FFc29";
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

  // 메타마스크 연결
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
      alert("MetaMask가 설치되지 않았습니다.");
    }
  };

  // 파일 변경 처리
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // IPFS에 파일 업로드
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

  // 메타데이터 생성 및 IPFS에 업로드
  const createMetadata = async (imageUrl: string): Promise<string> => {
    const metadata = {
      name: "Banner",
      description: description,
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
      alert("먼저 MetaMask를 연결해 주세요.");
      return;
    }

    if (!window.ethereum) {
      alert("MetaMask가 설치되지 않았습니다.");
      return;
    }

    if (!file) {
      alert("먼저 파일을 업로드해 주세요.");
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

      // 메타데이터 작성 및 IPFS에 업로드
      const metadataUrl = await createMetadata(imageUrl);

      // NFT 민팅을 위한 허용량 확인 및 승인 요청
      const allowance = await bsmContract.allowance(account, bannerNFTAddress);
      const allowanceValue = allowance.toString(); // BSM token은 18 decimal이므로, 정확한 비교를 위해 문자열로 변환

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
      const tx = await nftContract.mintNFT(metadataUrl); // metadataUrl을 매개변수로 전달
      await tx.wait();

      alert("NFT가 성공적으로 민팅되었습니다!");
    } catch (error) {
      if (error instanceof Error) {
        alert(`NFT 민팅 실패: ${error.message}`);
      } else {
        alert("NFT 민팅 실패: 알 수 없는 오류");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mint-container">
      <h1>Mint Your NFT</h1>
      <p>아래 버튼을 눌러 NFT를 민팅하세요.</p>
      {account ? (
        <div className="mint-controls">
          <input type="file" onChange={handleFileChange} />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="설명을 입력하세요"
          />
          <button onClick={handleMint} disabled={loading} className="btn">
            {loading ? "Minting..." : "Mint NFT"}
          </button>
        </div>
      ) : (
        <button onClick={connectMetaMask} disabled={loading} className="btn">
          MetaMask 연결
        </button>
      )}
    </div>
  );
};

export default MintPage;
