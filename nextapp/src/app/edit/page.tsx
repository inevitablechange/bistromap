"use client";
import { IoLocation } from "react-icons/io5";
import { Button, Flex, FormControl, Input, Text } from "@chakra-ui/react";
import { NextPage } from "next";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import "react-quill/dist/quill.snow.css";
import parse from "html-react-parser";
import { GoogleMap } from "@/components/GoogleMap";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const modules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
      { align: [] },
    ],
    ["link", "image"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "link",
  "indent",
  "image",
  "code-block",
  "color",
];

const Edit: NextPage = () => {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [length, setLength] = useState<number>(0);

  useEffect(() => {
    console.log(
      parse(content).props?.children, // remove tags from content
      parse(content).props?.children.length // get length of content
    );
  }, [content]);
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
              <Flex paddingLeft={"14px"} align={"center"}>
                <IoLocation />
                Select Location
              </Flex>
              <Text>
                {length ? parse(content).props?.children.length : 0} letters /
                500 letters
              </Text>
            </Flex>
            <ReactQuill
              placeholder="Tell us your story"
              value={content}
              onChange={(e) => {
                setContent(e);
                setLength(e.length);
              }}
              modules={modules}
              formats={formats}
              style={{ width: "100%", height: "70%" }}
            />
          </FormControl>
          <GoogleMap />
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Edit;
