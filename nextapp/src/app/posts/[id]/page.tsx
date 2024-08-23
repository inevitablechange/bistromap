"use client";
import supabase from "@/lib/supabaseClient";
import { NextPage } from "next";
import { FC, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "@/context/AccountContext";
import { Box, Button, Flex, Heading } from "@chakra-ui/react";
import { IoLocation } from "react-icons/io5";
const Page: FC<NextPage> = () => {
  const { account } = useAccount();

  const [data, setData] = useState<Publication>();
  const [address, setAddress] = useState<string>("");
  const params = useParams();
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
      const { data, error } = await supabase
        .from("publications")
        .select("*")
        .eq("serial_number", params.id)
        .single();
      if (error) {
        return [];
      }
      console.log({ data });
      setData(data);
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
            {`${account?.slice(0, 4)}...${account?.slice(account.length - 4)}`}
          </Button>
          <Button rounded="full" bgColor="yellow.400" type="submit">
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
    </Box>
  );
};

export default Page;
