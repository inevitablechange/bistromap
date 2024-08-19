"use client";

import { IoLocation } from "react-icons/io5";
import { Button, Flex, FormControl, Input, Text } from "@chakra-ui/react";
import { NextPage } from "next";
import { useEffect, useState } from "react";
import "react-quill/dist/quill.snow.css";
import parse from "html-react-parser";
import GoogleMaps from "@/components/GoogleMaps";
import QuillEditor from "@/components/QuillEditor";

const Edit: NextPage = () => {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [length, setLength] = useState<number>(0);
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  useEffect(() => {
    console.log(
      parse(content).props?.children, // remove tags from content
      parse(content).props?.children.length // get length of content
    );
  }, [content]);

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
    setIsMapOpen(false); // 선택 후 구글 맵 닫기
  };

  return (
    <Flex
      width={"full"}
      flexGrow="1"
      flexDirection={"column"}
      alignItems={"center"}
      bgColor="yellow.200"
    >
      <Flex
        flexDirection={"column"}
        width={"900px"}
        alignItems="center"
        flexGrow="1"
      >
        <Flex marginTop={"20"} fontSize={"24px"} fontWeight={"700"}>
          Where Did You Go?
        </Flex>

        <Flex
          width={"full"}
          flexDirection={"column"}
          flexGrow="1"
          marginBottom={20}
        >
          <FormControl>
            <Flex
              width={"full"}
              marginY={"10"}
              justify={"space-between"}
              marginBottom={"4"}
            >
              <Button colorScheme="yellow.400">Wallet Address</Button>
              <Button colorScheme="chocolate.light" type="submit">
                Publish
              </Button>
            </Flex>
            <Input
              type="text"
              placeholder="Your Title Here"
              width="full"
              fontSize="24px"
              bg="transparent"
              borderColor="transparent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Flex marginY={"4"} justify="space-between">
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
              <Text>
                {length ? parse(content).props?.children.length : 0} letters /
                500 letters
              </Text>
            </Flex>
            <QuillEditor
              content={content}
              setContent={setContent}
              setLength={setLength}
            />
          </FormControl>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Edit;
