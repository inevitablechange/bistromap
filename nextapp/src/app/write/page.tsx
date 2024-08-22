"use client";

import { IoLocation } from "react-icons/io5";
import { Box, Button, Flex, FormControl, Input, Text } from "@chakra-ui/react";
import { NextPage } from "next";
import { useForm, FormProvider } from "react-hook-form";
import { useState } from "react";
import "react-quill/dist/quill.snow.css";
import { rewardContractAddress } from "@/constants";
import GoogleMaps from "@/components/GoogleMaps";
import QuillEditor from "@/components/QuillEditor";
import { useAccount } from "@/context/AccountContext";
import rewardAbi from "@/abis/reward.json";
import { ethers } from "ethers";

const Edit: NextPage = () => {
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
    console.log({ locationHere: location });
    setIsMapOpen(false); // 선택 후 구글 맵 닫기
  };

  async function onSubmit(values: any) {
    // create
    console.log(values);
    const form = values;
    form.content = content;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const rewardContract = new ethers.Contract(
      rewardContractAddress,
      rewardAbi,
      signer
    );
    const lng = form.lng * Math.pow(10, 6);
    const lat = form.lat * Math.pow(10, 6);
    const base64Html = Buffer.from(form.content).toString("base64");
    // ethereum network에 publish.
    rewardContract.publish(form.title, form.place, base64Html, lng, lat);
  }
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
