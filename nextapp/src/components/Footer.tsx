"use client";

import { NextPage } from "next";

import { Stack, HStack, VStack, Link, Flex } from "@chakra-ui/react";

const Footer: NextPage = () => {
  return (
    <Flex
      bgColor="gray.200"
      p={{ base: 5, md: 8 }}
      w="100%"
      justifyContent="center"
    >
      <Stack
        w={1280}
        px={8}
        spacing={{ base: 8, md: 0 }}
        direction={{ base: "column", md: "row" }}
      >
        <HStack
          spacing={4}
          justifyContent={{ sm: "space-between", md: "normal" }}
        >
          <VStack spacing={4} alignItems="flex-start">
            <Link
              href="/terms"
              fontSize="sm"
              _hover={{ textDecoration: "underline" }}
              target="_blank"
            >
              Terms of Service
            </Link>
            <Flex
              gap={2}
              fontSize="xs"
              alignItems="flex-start"
              color="gray.500"
            >
              © 2024 Elephant Poooh - All rights reserved
            </Flex>
          </VStack>
        </HStack>
      </Stack>
    </Flex>
  );
};

export default Footer;
