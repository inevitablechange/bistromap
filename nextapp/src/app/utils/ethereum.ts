import { ethers } from "ethers";
import BannerNFT from "../../../../solidity/artifacts/contracts/BannerNFT.sol/BannerNFT.json";
import { useAccount } from "@/context/AccountContext";

const contractAddress = "0x1ce31b93380D1cD249312b7b64e7BD9A4A218FeF";

export const mintNFT = async (): Promise<void> => {
  const { signer } = useAccount();

  if (!window.ethereum) {
    alert("MetaMask가 필요합니다.");
    return;
  }

  const nftContract = new ethers.Contract(
    contractAddress,
    BannerNFT.abi,
    signer
  );

  try {
    const tx = await nftContract.mintNFT();
    await tx.wait();
    alert("NFT가 성공적으로 민트되었습니다!");
  } catch (error) {
    console.error("NFT 민트 중 오류 발생:", error);
    alert("NFT 민트에 실패했습니다.");
  }
};
