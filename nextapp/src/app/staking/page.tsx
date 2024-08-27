"use client";

import { useState, useEffect } from "react";
import { BigNumberish, Contract, ethers } from "ethers";
import { Button, Flex } from "@chakra-ui/react";

import STAKING_CONTRACT_ABI from "../../abi/Staking.json";
import LPTOKEN_STAKING_CONTRACT_ABI from "../../abi/LpTokenStaking.json";
import BSM_TOKEN_ABI from "../../abi/BsmToken.json";
import LP_TOKEN_ABI from "../../abi/UniswapPair.json";

import { useAccount } from "@/context/AccountContext";

import Staking from "@/components/Staking";
import LpTokenStaking from "@/components/LpTokenStaking";
import config from "@/constants/config";

export default function BSMstake() {
  const { signer } = useAccount();

  const [activeComponent, setActiveComponent] = useState<string>("Stake");
  const [balance, setBalance] = useState<BigNumberish>(BigInt(0));
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [bsmContract, setBsmContract] = useState<Contract | null>(null);

  // const related to Lp tokens Staking
  const [lpTokenBalance, setLpTokenBalance] = useState<BigNumberish>(BigInt(0));
  const [lpTokenStakedAmount, setLpTokenStakedAmount] = useState<number>(0);
  const [lpTokenContract, setLpTokenContract] = useState<Contract | null>(null);
  const [lpTokenStakingContract, setLpTokenStakingContract] =
    useState<Contract | null>(null);
  const [lpTokenReward, setLpTokenReward] = useState<number>(0);

  // consts related to Staking
  const [stakedAmount, setStakedAmount] = useState<number>(0);
  const [stakedTimestamp, setStakedTimestamp] = useState<number>(0);
  const [canUnstake, setCanUnstake] = useState<boolean>(false);
  const [stakingContract, setStakingContract] = useState<Contract | null>(null);
  const [reward, setReward] = useState<number>(0);

  const initializeEthers = async () => {
    try {
      const stakingContract = new ethers.Contract(
        config.BSM_STAKING,
        STAKING_CONTRACT_ABI,
        signer
      );

      const lpTokenStakingContract = new ethers.Contract(
        config.LP_BSM_STAKING,
        LPTOKEN_STAKING_CONTRACT_ABI,
        signer
      );

      const lpTokenContract = new ethers.Contract(
        config.UNISWAP_V2_PAIR,
        LP_TOKEN_ABI,
        signer
      );

      const bsmToken = new ethers.Contract(
        config.BSM_ADDRESS,
        BSM_TOKEN_ABI,
        signer
      );

      setStakingContract(stakingContract);
      setLpTokenStakingContract(lpTokenStakingContract);
      setBsmContract(bsmToken);
      setLpTokenContract(lpTokenContract);
    } catch (error) {
      console.error("Failed to connect to Ethereum:", error);
    }
  };

  const fetchBalances = async () => {
    if (signer && bsmContract) {
      try {
        const BSMBalance = await bsmContract.balanceOf(signer.address);
        setBalance(BSMBalance);
      } catch (error) {
        console.error("Failed to fetch balances:", error);
      }
    }
  };

  const fetchLpTokenBalances = async () => {
    if (signer && lpTokenContract) {
      try {
        const lpBSMBalance = await lpTokenContract.balanceOf(signer.address);
        setLpTokenBalance(lpBSMBalance);
      } catch (error) {
        console.error("Failed to fetch Lp Token balances:", error);
      }
    }
  };

  const fetchReward = async () => {
    if (signer && stakingContract) {
      try {
        const rewardAmount = await stakingContract.calculateReward(
          signer.address
        );
        setReward(rewardAmount);
      } catch (error) {
        console.error("Failed to fetch reward:", error);
      }
    }
  };

  const fetchLpTokenReward = async () => {
    if (signer && lpTokenStakingContract) {
      try {
        const lpTokenStakedInfo = await lpTokenStakingContract.getStakingAmount(
          signer.address
        );
        if (lpTokenStakedInfo) {
          const rewardAmount = await lpTokenStakingContract.getPendingRewards(
            signer.address
          );

          setLpTokenReward(rewardAmount);
        }
      } catch (error) {
        console.error("Failed to fetch reward:", error);
      }
    }
  };

  const fetchStakedInfo = async () => {
    if (signer && stakingContract) {
      try {
        const stakedInfo = await stakingContract.stakes(signer.address);
        setStakedAmount(stakedInfo.amount);
        setStakedTimestamp(Number(stakedInfo.timestamp));

        // Calculate if the user can unstake
        const currentTimestamp = Math.floor(Date.now() / 1000); // 현재 시간을 초 단위로 변환
        const canUnstake =
          currentTimestamp >=
          Number(stakedInfo.timestamp) + 24 * 7 * 24 * 60 * 60; // 24 weeks in seconds
        setCanUnstake(canUnstake);
      } catch (error) {
        console.error("Failed to fetch staked information:", error);
      }
    }
  };

  const fetchLpTokenStakedInfo = async () => {
    if (signer && lpTokenStakingContract) {
      try {
        const lpTokenStakedInfo = await lpTokenStakingContract.getStakingAmount(
          signer.address
        );
        setLpTokenStakedAmount(lpTokenStakedInfo);
      } catch (error) {
        console.error("Failed to fetch staked information:", error);
      }
    }
  };

  useEffect(() => {
    if (!signer) return;

    initializeEthers();
  }, [signer]);

  useEffect(() => {
    if (
      !signer ||
      !lpTokenContract ||
      !bsmContract ||
      !lpTokenStakingContract ||
      !stakingContract
    )
      return;

    //fetch bsm token balance
    fetchBalances();
    fetchLpTokenBalances();

    //fetch lptoken staking info
    fetchLpTokenReward();
    fetchLpTokenStakedInfo();

    //fetch staking info
    fetchReward();
    fetchStakedInfo();
  }, [
    signer,
    lpTokenContract,
    bsmContract,
    lpTokenStakingContract,
    stakingContract,
  ]);

  return (
    <Flex flexDir={"column"} padding={"20"} minWidth={"800px"} align={"center"}>
      <Flex gap={4} justifyContent={"center"} minW={"full"}>
        <Button
          bgColor={
            activeComponent === "lpTokenStake" ? "gray.100" : "yellow.400"
          }
          onClick={() => setActiveComponent("Stake")}
          flex={1}
        >
          Stake BSM Token
        </Button>
        <Button
          bgColor={
            activeComponent === "lpTokenStake" ? "yellow.400" : "gray.100"
          }
          onClick={() => setActiveComponent("lpTokenStake")}
          flex={1}
        >
          Stake lpBSM Token
        </Button>
      </Flex>
      {activeComponent === "Stake" ? (
        <Staking
          stakingContract={stakingContract}
          bsmContract={bsmContract}
          fetchBalances={fetchBalances}
          fetchStakedInfo={fetchStakedInfo}
          canUnstake={canUnstake}
          balance={balance}
          stakedAmount={stakedAmount}
          reward={reward}
        />
      ) : (
        <LpTokenStaking
          signer={signer}
          lpTokenStakingContract={lpTokenStakingContract}
          bsmContract={bsmContract}
          lpTokenContract={lpTokenContract}
          fetchBalances={fetchBalances}
          fetchLpTokenBalances={fetchLpTokenBalances}
          fetchLpTokenStakedInfo={fetchLpTokenStakedInfo}
          lpTokenBalance={lpTokenBalance}
          lpTokenStakedAmount={lpTokenStakedAmount}
          lpTokenReward={lpTokenReward}
        />
      )}
    </Flex>
  );
}
