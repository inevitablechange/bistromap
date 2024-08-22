"use client";

import { IoLocation } from "react-icons/io5";
import supabase from "../supabaseClient";
import { Box, Button, Flex, FormControl, Input, Text } from "@chakra-ui/react";
import { NextPage } from "next";
import { useForm, FormProvider } from "react-hook-form";
import { useEffect, useState } from "react";
import "react-quill/dist/quill.snow.css";
import { rewardContractAddress } from "@/constants";
import GoogleMaps from "@/components/GoogleMaps";
import QuillEditor from "@/components/QuillEditor";
import { useAccount } from "@/context/AccountContext";
import rewardABI from "@/abi/Reward.json";
import { ethers } from "ethers";
import { Contract } from "ethers";

interface ReviewData {
  user_address: string; // 이더리움 주소, 42자짜리 문자열
  id: number;
  serial_number: number;
  title: string; // 리뷰 제목
  content: string; // 리뷰 내용
  restaurant: string; // 방문한 장소 이름
  longitude: number; // 경도 (예: -122.4194)
  latitude: number; // 위도 (예: 37.7749)
  published_at: string; // 발행 시간 (ISO 포맷)
}

const Edit: NextPage = () => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [content, setContent] = useState<string>("");
  const [length, setLength] = useState<number>(0);
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const methods = useForm();
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = methods;
  const { account } = useAccount();

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
    setIsMapOpen(false); // 선택 후 구글 맵 닫기
  };

  async function onSubmit(values: any) {
    try {
      console.log("values::", values);
      values.content = content;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const rewardContract = new ethers.Contract(
        rewardContractAddress,
        rewardABI,
        signer
      );
      console.log({ rewardContract });
      setContract(rewardContract);
      const lng = Math.floor(values.location.lng * Math.pow(10, 6));
      const lat = Math.floor(values.location.lat * Math.pow(10, 6));
      const base64Html = Buffer.from(values.content).toString("base64");
      // ethereum network에 publish.
      rewardContract.publish(values.title, values.place, base64Html, lng, lat);
      console.log("publish ok");
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    if (!contract) return;
    contract.on("Published", async (user_address, serial_number) => {
      console.log("Published event detected:");
      // Fetch review details from contract
      const review = await contract.getReview(serial_number);
      const decodedContent = Buffer.from(review.content, "base64").toString(); // Decode base64 to HTML content

      // Save to Supabase
      const { error } = await supabase.from("publications").insert([
        {
          user_address: review.writer,
          serial_number: parseInt(serial_number),
          title: review.title,
          content: decodedContent,
          published_at: new Date(parseInt(review.publishedAt) * 1000), // Convert Unix timestamp to JavaScript Date
          restaurant: review.restaurant,
          longitude: parseInt(review.longitude) / Math.pow(10, 6), // Convert back to original decimal values
          latitude: parseInt(review.latitude) / Math.pow(10, 6),
        },
      ]);
      if (error) {
        console.log(error);
      }
      // You can handle the event here, such as updating the UI
      alert(
        `New review published by ${user_address} with review number ${serial_number}`
      );
    });
  }, [contract]);

  return (
    <Box w={"100%"} bgColor="yellow.100" height="calc(100vh - 60px)">
      <Box width={"1024px"} marginX="auto">
        <Flex
          justifyContent={"center"}
          marginTop={12}
          fontSize={"42px"}
          fontWeight={"700"}
        >
          Where Did You Go?
        </Flex>

        <FormProvider {...methods}>
          <Flex width={"full"}>
            <form
              action=""
              onSubmit={handleSubmit(onSubmit)}
              style={{ width: "100%" }}
            >
              <FormControl>
                <Flex
                  width={"full"}
                  justify={"space-between"}
                  marginTop={10}
                  marginBottom={14}
                >
                  <Button style={{ borderRadius: 50 }} colorScheme="yellow.400">
                    {`${account?.slice(0, 4)}...${account?.slice(
                      account.length - 4
                    )}`}
                  </Button>
                  <Button
                    style={{ borderRadius: 50 }}
                    colorScheme="chocolate.light"
                    type="submit"
                  >
                    Publish
                  </Button>
                </Flex>
              </FormControl>
              <Box bgColor={"white"} py={6} px={3} rounded="lg">
                <FormControl mb={3}>
                  <Input
                    my={2}
                    type="text"
                    placeholder="Your Title Here"
                    width="full"
                    fontSize="24px"
                    bg="transparent"
                    borderColor={"transparent"}
                    id="title"
                    {...register("title", {
                      required: "This is required",
                      minLength: {
                        value: 4,
                        message: "Minimum length should be 4",
                      },
                    })}
                    required
                  />
                </FormControl>
                <FormControl>
                  <Input
                    type="text"
                    borderColor={"transparent"}
                    fontSize={"lg"}
                    {...register("place", {
                      required: "This is required",
                    })}
                    placeholder="What was the name of the place you visited?"
                  />
                </FormControl>
                <Flex justify="space-between" mt={8} mb={6}>
                  <Button
                    paddingLeft={"14px"}
                    onClick={() => {
                      setIsMapOpen(!isMapOpen);
                    }}
                  >
                    <IoLocation />
                    {selectedLocation ? selectedLocation : "Select Location"}
                  </Button>
                  {isMapOpen && (
                    <GoogleMaps onLocationSelect={handleLocationSelect} />
                  )}
                  <Flex>
                    <Text color={length < 500 ? "red" : "gray.800"}>
                      {" "}
                      {length ? length : "0"} letters{" "}
                    </Text>
                    &nbsp;/ minimum 500 letters
                  </Flex>
                </Flex>
                <QuillEditor
                  content={content}
                  setContent={setContent}
                  setLength={setLength}
                />
              </Box>
            </form>
          </Flex>
        </FormProvider>
      </Box>
    </Box>
  );
};

export default Edit;
