import { rewardContractAddress } from "@/constants";
import { ethers } from "ethers";
import rewardAbi from "@/abis/reward.json";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest, response: NextResponse) => {
  const searchParams = new URL(request.url).searchParams;
  const page = Number(searchParams.get("page")) || 0;
  const size = Number(searchParams.get("size")) || 0;
  const provider = new ethers.JsonRpcProvider("https://your-rpc-url");
  const contract = new ethers.Contract(
    rewardContractAddress,
    rewardAbi,
    provider
  );

  const reviewCount = await contract.getReviewCount();
  const reviews = [];

  for (let i = (page - 1) * size; i < page * size && i < reviewCount; i++) {
    const review = await contract.getReview(i);
    reviews.push(review);
  }
  return NextResponse.json({ reviews, reviewCount });
};
