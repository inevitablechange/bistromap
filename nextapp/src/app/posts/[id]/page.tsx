"use client";
import supabase from "@/lib/supabaseClient";
import { FC, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "@/context/AccountContext";
import { Box, Button, Flex, Heading, Input, useToast } from "@chakra-ui/react";
import { IoLocation } from "react-icons/io5";
import VoteModal from "@/components/VoteModal";
import config from "@/constants/config";
import RewardABI from "@/abi/Reward.json";
import TokenABI from "@/abi/BsmToken.json";

import { Contract, ethers } from "ethers";
import LoaderModal from "@/components/LoaderModal";
import { storeEthereumAddress } from "@/utils/ethereumAddressHandler";
const VOTE_COST = 3 * Math.pow(10, 18);

const Page: FC = () => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [tokenContract, setTokenContract] = useState<Contract | null>(null);
  const [data, setData] = useState<Publication>();
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [num, setNum] = useState<number>(1);
  const {
    account,
  }: {
    account: string | null;
  } = useAccount();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const params = useParams();

  const toast = useToast();
  const handleVote = async () => {
    if (!account) return;
    storeEthereumAddress(account);
    if (!contract || !tokenContract) {
      console.log("contract object is not set");
      return;
    }
    try {
      setLoading(true);
      const tx = await tokenContract.approve(
        config.REVIEW_REWARD,
        BigInt(VOTE_COST)
      );
      const receipt = await tx.wait();
      console.log({ receipt });
      const tx2 = await contract.vote(Number(params.id));
      const receipt2 = await tx2.wait();
      console.log({ receipt2 });
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
    } finally {
      setLoading(false);
      toast({
        title: "Successfully Voted",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      setIsModalOpen(false);
    }
  };

  // const getReviewAndUpload = async () => { // dev 에서만
  //   if (!provider) return;
  //   const rewardContract = new ethers.Contract(
  //     config.REVIEW_REWARD,
  //     RewardABI,
  //     signer
  //   );
  //   console.log({ rewardContract });
  //   const review = await rewardContract.getReview(num);
  //   const decodedContent = Buffer.from(review.content, "base64").toString();
  //   const { error } = await supabase.from("publications").insert([
  //     {
  //       user_address: review.writer,
  //       serial_number: num,
  //       title: review.title,
  //       content: decodedContent,
  //       published_at: new Date(parseInt(review.publishedAt) * 1000), // Convert Unix timestamp to JavaScript Date
  //       restaurant: review.restaurant,
  //       longitude: parseInt(review.longitude) / Math.pow(10, 6), // Convert back to original decimal values
  //       latitude: parseInt(review.latitude) / Math.pow(10, 6),
  //       votes: 0,
  //     },
  //   ]);
  //   if (error) {
  //     toast({
  //       title: "Oops! There was an error",
  //       description: error.message,
  //       status: "error",
  //       duration: 7000,
  //       isClosable: true,
  //     });
  //     console.log(error);
  //   }
  // };
  useEffect(() => {
    const accountGetter = async () => {
      const provider = new ethers.BrowserProvider(window.ethereum);
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
  }, []);

  useEffect(() => {
    if (!contract) return;
    const onVoted = async (_: string, serial_number: BigInt, votes: BigInt) => {
      try {
        if (!account) return;
        console.log("Voted event detected:");
        setLoading(true);
        const { data: publicationData, error: fetchError } = await supabase
          .from("publications")
          .select(
            `
            id,
            serial_number,
            users!inner (
              user_address
            )
          `
          )
          .eq("serial_number", Number(serial_number).toString())
          .single();
        if (fetchError) {
          console.error("Error fetching publication:", fetchError);
          toast({
            title: "Oops! There was an error",
            description: fetchError.message,
            status: "error",
            duration: 7000,
            isClosable: true,
          });
          return;
        }
        if (!publicationData) {
          console.error("No publication found for this user_address");
          return;
        }

        // 2. 찾은 publication 업데이트
        const { error: updateError } = await supabase
          .from("publications")
          .update({ votes: Number(votes) })
          .eq("id", publicationData.id);

        if (updateError) {
          console.error("Error updating publication:", updateError);
          toast({
            title: "Oops! There was an error",
            description: updateError.message,
            status: "error",
            duration: 7000,
            isClosable: true,
          });
        } else {
          console.log("Publication updated successfully");
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
        .select(
          `
          *,
          users!inner (
            user_address
          )
        `
        )
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
        <Flex>
          <Input
            type="text"
            value={num}
            onChange={(e) => setNum(Number(e.target.value))}
          />
          {/* <Button onClick={getReviewAndUpload}>getReviewAndUpload</Button> */}
        </Flex>
        <Flex
          width={"full"}
          justify={"space-between"}
          marginTop={10}
          marginBottom={14}
        >
          <Button style={{ borderRadius: 50 }} bgColor="mint">
            {`${data.users.user_address?.slice(
              0,
              4
            )}...${data.users.user_address?.slice(
              data.users.user_address.length - 4
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
