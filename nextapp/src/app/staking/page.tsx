"use client";

import { useState, useEffect } from "react";
import { Contract, ethers } from "ethers";
import { Button, Flex } from "@chakra-ui/react";

import STAKING_CONTRACT_ABI from "../../abi/Staking.json";
import LPTOKEN_STAKING_CONTRACT_ABI from "../../abi/LpTokenStaking.json";
import BSM_TOKEN_ABI from "../../abi/BsmToken.json";

import { lpTokenStakingContractAddress as LPTOKEN_STAKING_CONTRACT_ADDRESS } from "../../constants/index";
import { stakingContractAddress as STAKING_CONTRACT_ADDRESS } from "../../constants/index";
import { bsmContractAddress as BSM_TOKEN_ADDRESS } from "../../constants/index";
import { useAccount } from "@/context/AccountContext";

import Staking from "@/components/Staking";
import LpTokenStaking from "@/components/LpTokenStaking";

export default function BSMstake() {
  const { signer } = useAccount();

  const [activeComponent, setActiveComponent] =
    useState<string>("lpTokenStake");
  const [balance, setBalance] = useState<{ BSM: number }>({ BSM: 0 });
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [bsmContract, setBsmContract] = useState<Contract | null>(null);

  // const related to Lp tokens Staking
  const [lpTokenStakedAmount, setLpTokenStakedAmount] = useState<number>(0);
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
        STAKING_CONTRACT_ADDRESS,
        STAKING_CONTRACT_ABI,
        signer
      );

      const lpTokenStakingContract = new ethers.Contract(
        LPTOKEN_STAKING_CONTRACT_ADDRESS,
        LPTOKEN_STAKING_CONTRACT_ABI,
        signer
      );

      const bsmToken = new ethers.Contract(
        BSM_TOKEN_ADDRESS,
        BSM_TOKEN_ABI,
        signer
      );

      setStakingContract(stakingContract);
      setLpTokenStakingContract(lpTokenStakingContract);
      setBsmContract(bsmToken);
      setIsConnected(true);
    } catch (error) {
      console.error("Failed to connect to Ethereum:", error);
    }
  };

  const fetchBalances = async () => {
    if (signer && bsmContract) {
      try {
        const address = await signer.getAddress();
        const BSMBalance = await bsmContract.balanceOf(address);
        setBalance({
          BSM: parseFloat(ethers.formatEther(BSMBalance)),
        });
      } catch (error) {
        console.error("Failed to fetch balances:", error);
      }
    }
  };

  const fetchReward = async () => {
    if (signer && stakingContract) {
      try {
        const address = await signer.getAddress();
        const rewardAmount = await stakingContract.calculateReward(address);
        setLpTokenReward(parseFloat(ethers.formatEther(rewardAmount)));
      } catch (error) {
        console.error("Failed to fetch reward:", error);
      }
    }
  };

  const fetchLpTokenReward = async () => {
    if (signer && lpTokenStakingContract) {
      try {
        const address = await signer.getAddress();
        const rewardAmount = await lpTokenStakingContract.calculateReward(
          address
        );
        setReward(parseFloat(ethers.formatEther(rewardAmount)));
      } catch (error) {
        console.error("Failed to fetch reward:", error);
      }
    }
  };

  const fetchStakedInfo = async () => {
    if (signer && stakingContract) {
      try {
        const address = await signer.getAddress();
        const stakedInfo = await stakingContract.stakes(address);
        setStakedAmount(parseFloat(ethers.formatEther(stakedInfo.amount)));
        setStakedTimestamp(stakedInfo.timestamp.toNumber());

        // Calculate if the user can unstake
        const currentTimestamp = Math.floor(Date.now() / 1000); // 현재 시간을 초 단위로 변환
        const canUnstake =
          currentTimestamp >=
          stakedInfo.timestamp.toNumber() + 24 * 7 * 24 * 60 * 60; // 24 weeks in seconds
        setCanUnstake(canUnstake);
      } catch (error) {
        console.error("Failed to fetch staked information:", error);
      }
    }
  };

  const fetchLpTokenStakedInfo = async () => {
    if (signer && lpTokenStakingContract) {
      try {
        const address = await signer.getAddress();
        const lpTokenStakedInfo = await lpTokenStakingContract.getStakingAmount(
          address
        );
        setLpTokenStakedAmount(
          parseFloat(ethers.formatEther(lpTokenStakedInfo.amount))
        );
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
    if (isConnected) {
      //fetch bsm token balance
      fetchBalances();

      //fetch lptoken staking info
      fetchLpTokenReward();
      fetchLpTokenStakedInfo();

      //fetch staking info
      fetchReward();
      fetchStakedInfo();
    }
  }, [isConnected]);

  return (
    <Flex flexDir={"column"} padding={"20"} minWidth={"800px"} align={"center"}>
      <Flex gap={4} justifyContent={"center"} minW={"full"}>
        <Button
          bgColor={
            activeComponent === "lpTokenStake" ? "yellow.400" : "gray.100"
          }
          onClick={() => setActiveComponent("lpTokenStake")}
          flex={1}
        >
          Stake lpBSM Token
        </Button>
        <Button
          bgColor={
            activeComponent === "lpTokenStake" ? "gray.100" : "yellow.400"
          }
          onClick={() => setActiveComponent("Stake")}
          flex={1}
        >
          Stake BSM Token
        </Button>
      </Flex>
      {activeComponent === "lpTokenStake" ? (
        <LpTokenStaking
          lpTokenStakingContract={lpTokenStakingContract}
          bsmContract={bsmContract}
          LPTOKEN_STAKING_CONTRACT_ADDRESS={LPTOKEN_STAKING_CONTRACT_ADDRESS}
          fetchBalances={fetchBalances}
          fetchLpTokenStakedInfo={fetchLpTokenStakedInfo}
          balance={balance}
          lpTokenStakedAmount={lpTokenStakedAmount}
          lpTokenReward={lpTokenReward}
        />
      ) : (
        <Staking
          stakingContract={stakingContract}
          bsmContract={bsmContract}
          STAKING_CONTRACT_ADDRESS={STAKING_CONTRACT_ADDRESS}
          fetchBalances={fetchBalances}
          fetchStakedInfo={fetchStakedInfo}
          canUnstake={canUnstake}
          balance={balance}
          stakedAmount={stakedAmount}
          reward={reward}
        />
      )}
    </Flex>
  );
}
