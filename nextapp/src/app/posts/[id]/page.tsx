"use client";
import supabase from "@/lib/supabaseClient";
import { FC, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "@/context/AccountContext";
import { Box, Button, Flex, Heading, useToast } from "@chakra-ui/react";
import { IoLocation } from "react-icons/io5";
import VoteModal from "@/components/VoteModal";
import config from "@/constants/config";
import RewardABI from "@/abi/Reward.json";
import TokenABI from "@/abi/BsmToken.json";

import { BrowserProvider, Contract, ethers } from "ethers";
import LoaderModal from "@/components/LoaderModal";
const VOTE_COST = 3 * Math.pow(10, 18);

const Page: FC = () => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [tokenContract, setTokenContract] = useState<Contract | null>(null);
  const [data, setData] = useState<Publication>();
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const params = useParams();
  const { provider }: { provider: BrowserProvider | null } = useAccount();
  const toast = useToast();
  const handleVote = async () => {
    if (!contract || !tokenContract) {
      console.log("contract object is not set");
      return;
    }
    try {
      await tokenContract.approve(config.REVIEW_REWARD, VOTE_COST);
      await contract.vote(params.id);
    } catch (e) {
      console.error("Error fetching vote data:", e);
      toast({
        title: "Oops! There was an error",
        // @ts-ignore
        description: e.message,
        status: "error",
        duration: 7000,
        isClosable: true,
      });
    }
  };
  useEffect(() => {
    const accountGetter = async () => {
      if (!provider) return;
      const signer = await provider.getSigner();
      const rewardContract = new ethers.Contract(
        config.REVIEW_REWARD,
        RewardABI,
        signer
      );

      const bsmContract = new ethers.Contract(
        config.BSM_ADDRESS,
        TokenABI,
        signer
      );

      setContract(rewardContract);
      setTokenContract(bsmContract);
    };
    accountGetter();
  }, [provider]);

  useEffect(() => {
    if (!contract) return;
    console.log("below onpublish");
    const onVoted = async (
      writerAddress: string,
      serial_number: string,
      votes: BigInt
    ) => {
      try {
        console.log("Voted event detected:");
        setLoading(true);
        // Fetch review details from contract
        const review = await contract.getReview(serial_number);
        const decodedContent = Buffer.from(review.content, "base64").toString(); // Decode base64 to HTML content

        // Save to Supabase

        const { data, error } = await supabase
          .from("publications")
          .update({ votes: parseInt(votes.toString()) })
          .eq("user_address", writerAddress);
        if (error) {
          toast({
            title: "Oops! There was an error",
            description: error.message,
            status: "error",
            duration: 7000,
            isClosable: true,
          });
          console.log(error);
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    contract.on("Voted", onVoted);

    // Clean up the event listener when the component unmounts or dependencies change
    return () => {
      contract.off("Voted", onVoted);
    };
  }, [contract]);
  useEffect(() => {
    if (!data) return;
    const getLocation = async () => {
      fetch(
        `/api/location?latitude=${data.latitude}&longitude=${data.longitude}`
      )
        .then((res) => res.json())
        .then((res) => {
          setAddress(res.plus_code.compound_code);
        });
    };
    getLocation();
  }, [data]);
  useEffect(() => {
    if (!params.id) return;

    const getReviews = async () => {
      // Supabase에서 데이터 가져오기
      const { data: fetchedData, error } = await supabase
        .from("publications")
        .select("*")
        .eq("serial_number", params.id)
        .single();

      setData(fetchedData);
    };

    getReviews();
  }, [params]);

  if (!data) return null;

  return (
    <Box w={"100%"} height="fit-content">
      <Box width={"1024px"} marginX="auto">
        <Flex
          width={"full"}
          justify={"space-between"}
          marginTop={10}
          marginBottom={14}
        >
          <Button style={{ borderRadius: 50 }} bgColor="mint">
            {`${data.user_address?.slice(0, 4)}...${data.user_address?.slice(
              data.user_address.length - 4
            )}`}
          </Button>
          <Button
            rounded="full"
            bgColor="yellow.400"
            type="submit"
            onClick={() => setIsModalOpen((prev) => !prev)}
          >
            Vote for this article
          </Button>
        </Flex>
        <Box bgColor={"white"} py={6} px={3} rounded="lg">
          <Flex>
            <Heading>{data.title}</Heading>
          </Flex>
          <Flex justify="space-between" mt={8} mb={6}>
            <Button paddingLeft={"14px"}>
              <IoLocation />
              {address}, {data.restaurant}
            </Button>
          </Flex>
          <Box dangerouslySetInnerHTML={{ __html: data.content }}></Box>
        </Box>
      </Box>
      <VoteModal
        isOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        onVote={handleVote}
      />
      <LoaderModal isOpen={loading} setIsModalOpen={setLoading} />
    </Box>
  );
};

export default Page;
