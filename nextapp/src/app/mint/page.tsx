"use client";

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import BannerNFT from "../../../../solidity/artifacts/contracts/BannerNFT.sol/BannerNFT.json";
import axios from "axios";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
} from "@chakra-ui/react";
import { useAccount } from "@/context/AccountContext";
import { redirect } from "next/navigation";
import config from "@/constants/config";
import bsmABI from "@/abi/BsmToken.json";
const bannerNFTAddress = "0xA6677DD9FcD2FD71085f199455a121caaeE69853";

const NFT_PRICE = ethers.parseUnits("2000", 18); // 2000 BSM, 18 decimals

const PinataUploadUrl = "https://api.pinata.cloud/pinning/pinFileToIPFS";

const MintPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState<string>("");
  const [restaurant, setRestaurant] = useState<string>("");

  const { account } = useAccount();
  const isError = description === "" || restaurant == "" || file == null;
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
    formData.append(
      "pinataMetadata",
      `{\n  "name": "${restaurant}",\n  "keyvalues": { \n"link":"${description}"\n}\n}`
    );
    formData.append("pinataOptions", '{\n  "cidVersion": 1\n}');
    try {
      const options = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      };
      const response = await axios.post(PinataUploadUrl, formData, options);
      const ipfsHash = response.data.IpfsHash;
      return `https://ipfs.io/ipfs/${ipfsHash}`;
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
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
    const bsmContract = new ethers.Contract(config.BSM_ADDRESS, bsmABI, signer);

    try {
      setLoading(true);

      // 파일을 IPFS에 업로드
      const imageUrl = await uploadToIPFS(file);

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
      const tx = await nftContract.mintNFT(imageUrl);
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

  useEffect(() => {
    if (!account) redirect("/");
  }, [account]);

  return (
    <Box mb={10} width={"1280px"}>
      <Box bgColor={"lightGreen"} textAlign={"center"} py={16}>
        <Heading as="h1">Mint Your NFT</Heading>
      </Box>

      <Flex
        gap={12}
        direction="column"
        bgColor="cream"
        mt={6}
        rounded={"lg"}
        py={8}
        px={4}
      >
        <FormControl isInvalid={isError} isRequired>
          <FormLabel>Restaurant Name</FormLabel>
          <Input
            type="text"
            placeholder="Restaurant name"
            value={restaurant}
            onChange={(e) => setRestaurant(e.target.value)}
          />
          <FormHelperText>
            Please write down the name of restaurant.
          </FormHelperText>
        </FormControl>
        <FormControl isInvalid={isError} isRequired>
          <FormLabel>Website or link to introduce your restaurant.</FormLabel>
          <Input
            type="text"
            placeholder="Website or link"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormControl>
        <FormControl isInvalid={isError} isRequired>
          <FormLabel>
            Please upload an image file which will be used as banner&nbsp;&nbsp;{" "}
            <small>1280px(width) x 400px(height)</small>
          </FormLabel>
          <Input
            type="file"
            onChange={handleFileChange}
            placeholder="Enter the link"
          />
          <FormHelperText>
            Minting requires 2,000 BSM and it will be posted as banner right
            away. Please check the image before you mint.
          </FormHelperText>
        </FormControl>
      </Flex>

      <Button onClick={handleMint} disabled={loading} mt={12}>
        {loading ? "Minting..." : "Mint NFT"}
      </Button>
    </Box>
  );
};

export default MintPage;
