"use client";

import { IoLocation } from "react-icons/io5";
import supabase from "@/lib/supabaseClient";
import { storeEthereumAddress } from "@/utils/ethereumAddressHandler";
import { useRouter } from "next/navigation";

import {
  Box,
  Button,
  Flex,
  FormControl,
  Input,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useForm, FormProvider } from "react-hook-form";
import { FC, useEffect, useState } from "react";
import "react-quill/dist/quill.snow.css";
import config from "@/constants/config";
import GoogleMaps from "@/components/GoogleMaps";
import QuillEditor from "@/components/QuillEditor";
import { useAccount } from "@/context/AccountContext";
import RewardABI from "@/abi/Reward.json";
import { BrowserProvider, ethers, Signer } from "ethers";
import LoaderModal from "@/components/LoaderModal";

const Edit: FC = () => {
  const [contract, setContract] = useState<any>(null);
  const [content, setContent] = useState<string>("");
  const [length, setLength] = useState<number>(0);
  const [getDummyDataOn, setGetDummyDataOn] = useState<boolean>(false);
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [account, setAccount] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const toast = useToast();
  const methods = useForm();
  const router = useRouter();
  const { handleSubmit, register } = methods;
  const {
    provider,
  }: { provider: BrowserProvider | null; signer: Signer | null } = useAccount();

  useEffect(() => {
    const accountGetter = async () => {
      if (!provider) return;
      const signer = await provider.getSigner();
      const acc = await signer.getAddress();
      setAccount(acc);
      const rewardContract = new ethers.Contract(
        config.REVIEW_REWARD,
        RewardABI,
        signer
      );

      setContract(rewardContract);
    };
    accountGetter();
  }, [provider]);

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
    setIsMapOpen(false); // 선택 후 구글 맵 닫기
  };
  const getDummyData = (values: any) => {
    const obj = {
      user_address: account,
      serial_number: Math.floor(Math.random() * 201),
      title: values.title,
      content: values.content,
      published_at: new Date(),
      restaurant: values.place,
      longitude: values.location.lng,
      latitude: values.location.lat,
      votes: Math.floor(Math.random() * 201),
    };
    console.log("dummydata::", obj);
  };
  async function onSubmit(values: any) {
    try {
      if (!contract) {
        throw Error("No contract");
      }
      setIsLoading(true);
      console.log("values::", values);
      values.content = content;

      storeEthereumAddress(account!);
      if (getDummyDataOn) {
        return getDummyData(values);
      }

      const lng = Math.floor(values.location.lng * Math.pow(10, 6));
      const lat = Math.floor(values.location.lat * Math.pow(10, 6));
      const base64Html = Buffer.from(values.content).toString("base64");
      // ethereum network에 publish.
      await contract.publish(values.title, values.place, base64Html, lng, lat);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!contract) return;
    console.log("below onpublish");
    const onPublished = async (user_address: string, serial_number: string) => {
      try {
        console.log("Published event detected:");
        setIsLoading(true);
        // Fetch review details from contract
        const review = await contract.getReview(serial_number);
        const decodedContent = Buffer.from(review.content, "base64").toString(); // Decode base64 to HTML content

        // Save to Supabase
        // @ts-ignore
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
            votes: 0,
          },
        ]);
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
        toast({
          title: "Success",
          duration: 4000,
          isClosable: true,
        });
        setTimeout(() => {
          router.push("/");
        }, 1000);
        setIsLoading(false);
      }
    };
    console.log({ contract });
    contract.on("Published", onPublished);

    // Clean up the event listener when the component unmounts or dependencies change
    return () => {
      contract.off("Published", onPublished);
    };
  }, [contract]);

  return (
    <Box w={"100%"} min-height="calc(100vh - 60px)">
      <Box width={"1024px"} marginX="auto">
        <FormProvider {...methods}>
          <Flex width={"full"}>
            <Button
              onClick={() => {
                setGetDummyDataOn((prev) => !prev);
              }}
            >
              {!getDummyDataOn
                ? "DUMMY DATA 받기"
                : "실제로 이더리움에 제출하기"}
            </Button>
            <Text>
              {getDummyDataOn ? "제출을 누르면 더미데이터를 받아옵니다." : ""}
            </Text>
            <form
              action=""
              onSubmit={handleSubmit(onSubmit)}
              style={{ width: "100%" }}
            >
              <FormControl>
                <Flex width={"full"} justify={"space-between"} marginY={4}>
                  <Button
                    border="solid"
                    borderColor={"gray.300"}
                    style={{ borderRadius: 50 }}
                    bgColor="lightGreen"
                  >
                    {`${account?.slice(0, 4)}...${account?.slice(
                      account.length - 4
                    )}`}
                  </Button>
                  <Button rounded="full" bgColor="yellow.400" type="submit">
                    Publish
                  </Button>
                </Flex>
              </FormControl>
              <Box rounded="lg" height="calc(100vh - 132px)">
                <FormControl mb={2}>
                  <Input
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
                <Flex justify="space-between" my={2}>
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
                  content={content || ""}
                  setContent={setContent}
                  setLength={setLength}
                  setIsLoading={setIsLoading}
                />
              </Box>
            </form>
          </Flex>
        </FormProvider>
        <LoaderModal isOpen={isLoading} setIsModalOpen={setIsLoading} />
      </Box>
    </Box>
  );
};

export default Edit;
