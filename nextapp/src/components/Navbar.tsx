"use client";

import {
  Box,
  Flex,
  Text,
  Button,
  Stack,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
  useColorModeValue,
  useDisclosure,
  PopoverArrow,
  PopoverHeader,
  Heading,
} from "@chakra-ui/react";
import { ChevronRightIcon } from "@chakra-ui/icons";
import { FC, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAccount } from "@/context/AccountContext";

const NavBar: FC = () => {
  const { isOpen, onClose, onOpen } = useDisclosure();
  const { account, connectWallet, disconnectWallet } = useAccount();

  const handleDisconnect = () => {
    onClose();
    disconnectWallet();
  };

  useEffect(() => {
    if (localStorage.getItem("loggedIn") === "true") {
      connectWallet();
    }
  }, []);

  return (
    <Flex marginX={"auto"} maxWidth={"1280px"} flex={{ base: 1 }}>
      <Flex
        h={"60px"}
        py={{ base: 2 }}
        px={{ base: 4 }}
        flex={{ base: 1 }}
        justify={"space-between"}
      >
        <Image width={150} height={44} src="/assets/logo.png" alt="BistroMap" />
        <Stack
          flex={{ base: 1, md: 0 }}
          alignItems={"center"}
          justify={"flex-end"}
          direction={"row"}
          spacing={2}
        >
          <Flex
            display={{ base: "none", md: "flex" }}
            ml={10}
            mr={12}
            align={"center"}
          >
            <DesktopNav />
          </Flex>

          <Button
            href={"/write"}
            as="a"
            colorScheme="chocolate.light"
            fontSize={14}
          >
            Write
          </Button>
          <Popover isOpen={isOpen} closeOnBlur={true} closeOnEsc={true}>
            <PopoverTrigger>
              {account ? (
                <Button
                  colorScheme="yellow.400"
                  fontSize={14}
                  width={32}
                  onClick={onOpen}
                >{`${account.slice(0, 4)}...${account.slice(
                  account.length - 4
                )}`}</Button>
              ) : (
                <Button
                  colorScheme="yellow.400"
                  fontSize={14}
                  width={32}
                  onClick={connectWallet}
                >
                  Connect Wallet
                </Button>
              )}
            </PopoverTrigger>
            <PopoverContent width={32} textAlign={"center"}>
              <PopoverArrow />
              <PopoverHeader onClick={handleDisconnect}>
                <Heading as="h4" fontSize={"lg"} cursor="pointer">
                  Logout
                </Heading>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
        </Stack>
      </Flex>
    </Flex>
  );
};

const DesktopNav = () => {
  const pathname = usePathname();
  const linkColor = useColorModeValue("gray.600", "gray.200");
  const linkHoverColor = useColorModeValue("gray.800", "white");
  const popoverContentBgColor = useColorModeValue("white", "gray.800");

  return (
    <Stack direction={"row"} spacing={4}>
      {NAV_ITEMS.map((navItem) => (
        <Flex key={navItem.label} justifyContent={"center"} width={90}>
          <Popover trigger={"hover"} placement={"bottom-start"}>
            <PopoverTrigger>
              <Box
                as="a"
                p={2}
                href={navItem.href ?? "#"}
                fontSize={"sm"}
                fontWeight={navItem.href == pathname ? 600 : 500}
                color={navItem.href == pathname ? "gray.900" : linkColor}
                _hover={{
                  textDecoration: "none",
                  color: linkHoverColor,
                }}
              >
                {navItem.label}
              </Box>
            </PopoverTrigger>

            {navItem.children && (
              <PopoverContent
                border={0}
                boxShadow={"xl"}
                bg={popoverContentBgColor}
                p={4}
                rounded={"xl"}
                minW={"sm"}
              >
                <Stack>
                  {navItem.children.map((child) => (
                    <DesktopSubNav key={child.label} {...child} />
                  ))}
                </Stack>
              </PopoverContent>
            )}
          </Popover>
        </Flex>
      ))}
    </Stack>
  );
};

const DesktopSubNav = ({ label, href, subLabel }: NavItem) => {
  return (
    <Box
      as="a"
      href={href}
      role={"group"}
      display={"block"}
      p={2}
      rounded={"md"}
      _hover={{ bg: useColorModeValue("pink.50", "gray.900") }}
    >
      <Stack direction={"row"} align={"center"}>
        <Box>
          <Text
            transition={"all .3s ease"}
            _groupHover={{ color: "pink.400" }}
            fontWeight={500}
          >
            {label}
          </Text>
          <Text fontSize={"sm"}>{subLabel}</Text>
        </Box>
        <Flex
          transition={"all .3s ease"}
          transform={"translateX(-10px)"}
          opacity={0}
          _groupHover={{ opacity: "100%", transform: "translateX(0)" }}
          justify={"flex-end"}
          align={"center"}
          flex={1}
        >
          <Icon color={"pink.400"} w={5} h={5} as={ChevronRightIcon} />
        </Flex>
      </Stack>
    </Box>
  );
};

interface NavItem {
  label: string;
  subLabel?: string;
  children?: Array<NavItem>;
  href?: string;
}

const NAV_ITEMS: Array<NavItem> = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Swap",
    href: "/swap",
  },
  {
    label: "Stake", // "Stake" 항목 추가
    href: "/staking", // 스테이킹 페이지로 이동하도록 href 설정
  },
  {
    label: "Mission",
    href: "/attendance",
  },
  {
    label: "Reviews",
    href: "/reviews",
  },
  {
    label: "Selections",
    href: "/selections",
  },
];

export default NavBar;
