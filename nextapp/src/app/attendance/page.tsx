"use client";

import React, { useState, useEffect } from "react";
import Calendar, { TileArgs } from "react-calendar";
import supabase from "../../lib/supabaseClient";
import RewardABI from "@/abi/Reward.json";
import { formatDate } from "@/utils/formatter";
import config from "@/constants/config";
import "react-calendar/dist/Calendar.css";
import { useAccount } from "@/context/AccountContext";
import LoaderModal from "@/components/LoaderModal";
import { Box, Button, Flex, Heading, Text, useToast } from "@chakra-ui/react";
import "./calendar.css";
import dayjs from "dayjs";
import { BrowserProvider, ethers, Signer } from "ethers";
import { FaCheck } from "react-icons/fa";
import { storeEthereumAddress } from "@/utils/ethereumAddressHandler";
interface AttendanceData {
  [key: string]: number;
}
interface AttendancObject {
  [key: string]: number;
}

interface SupabaseData {
  id: string;
  attendance_dates: string[] | null;
}

const Page: React.FC = () => {
  const [attendanceObject, setAttendanceObject] = useState<AttendancObject>({});
  const toast = useToast();
  const [rewardContract, setRewardContract] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMarkedToday, setHasMarkedToday] = useState<boolean>(false);
  const [supabaseData, setSupabaseData] = useState<SupabaseData>({
    id: "",
    attendance_dates: [],
  });
  const {
    account,
    signer,
  }: {
    account: string | null;
    signer: Signer | null;
  } = useAccount();

  useEffect(() => {
    setAttendanceObject({});
    setHasMarkedToday(false);
    setSupabaseData({ id: "", attendance_dates: [] });
  }, [account]);

  async function fetchUserAttendance() {
    if (!account || !rewardContract) return;
    try {
      console.log("fetch");
      // 스마트 계약과 상호작용하여 데이터 가져오기
      const data = await rewardContract.getUserAttendance();
      const dateArray = data.dates.map(
        (el: BigInt) => dayjs(Number(el) * 1000).format
      );
      const makeAttendanceObject = (attendanceDates: string[]) => {
        const obj: AttendanceData = {};
        for (let date of attendanceDates) {
          const key: string = formatDate(new Date(date));
          obj[key] = 1;
        }
        return obj;
      };
      setAttendanceObject(makeAttendanceObject(dateArray));
      console.log("User Attendance:", data);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  }
  const makeAttendanceData = (attendanceDates: string[]) => {
    const obj: AttendanceData = {};
    for (let date of attendanceDates) {
      const key: string = formatDate(new Date(date));
      obj[key] = 1;
    }
    return obj;
  };

  useEffect(() => {
    const accountGetter = async () => {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const rewardContract = new ethers.Contract(
        config.REVIEW_REWARD,
        RewardABI,
        signer
      );

      setRewardContract(rewardContract);
    };
    accountGetter();
  }, []);

  useEffect(() => {
    if (!rewardContract) return;
    rewardContract.on("AttendanceMarked", onAttendanceMarked);

    () => {
      return rewardContract.off("AttendanceMarked", onAttendanceMarked);
    };
  }, [rewardContract]);

  const getAttendance = async (account: string) => {
    // 먼저, 해당 유저의 정보가 유저 테이블에 있는지 확인한다

    // 유저 정보가 테이블에 있다면 userId를 가지고 attendance 정보를 가져온다.

    // 유저 정보가 테이블에 없다면 그냥 둔다.
    const { data, error } = await supabase
      .from("attendance")
      .select(
        `
        id,
        attendance_dates,
        user_id,
        users!inner (
          user_address
        )
      `
      )
      .eq("users.user_address", account)
      .maybeSingle();

    console.log("supabase::", data);
    if (data && data.attendance_dates) {
      setSupabaseData(data);
      const ret = makeAttendanceData(data.attendance_dates);
      setAttendanceObject(ret);
    }
    if (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    if (!account) return;
    getAttendance(account);
  }, [account]);

  const uploadToSupabase = async () => {
    try {
      if (!account) return;
      setLoading(true);
      const {
        data: { id },
      }: { data: any; error: any } = await supabase
        .from("users")
        .select("*")
        .eq("user_address", account)
        .single();
      if (!id) throw new Error("no user id");
      try {
        const contact = new ethers.Contract(
          config.REVIEW_REWARD,
          RewardABI,
          signer
        );
        const userAttendance = await contact.getUserAttendance();
        const timestamps = userAttendance.dates.map(
          (date: BigInt) => Number(date) * 1000
        );
        const dateArr: string[] = timestamps.map((ts: Date) =>
          dayjs(ts).format()
        );
        const { data: attendanceRow } = await supabase
          .from("attendance")
          .select("*")
          .eq("user_id", id)
          .single();
        console.log({ attendanceRow });
        if (attendanceRow?.attendance_dates) {
          const { data } = await supabase
            .from("attendance")
            .update({
              attendance_dates: dateArr,
            })
            .eq("id", account);
          console.log({ data });
        } else {
          const { data } = await supabase.from("attendance").insert({
            user_id: id,
            attendance_dates: dateArr,
          });
          console.log({ data });
        }
      } catch (error: any) {
        toast({
          title: "Oops! There was an error",
          description: error.message,
          status: "error",
          duration: 7000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  function tileRender(content: TileArgs) {
    let lastDay = null;
    if (supabaseData.attendance_dates) {
      lastDay =
        supabaseData.attendance_dates[supabaseData.attendance_dates.length - 1];
    }
    // attendance object에 있는
    // console.log("content::", dayjs(content.date).isSame(dayjs(), "day"));
    if (attendanceObject[formatDate(content.date)]) {
      if (dayjs(lastDay).isSame(dayjs(), "day"))
        setTimeout(() => {
          setHasMarkedToday(true);
        }, 0);
      return <FaCheck color="green" fontSize={24} />;
    } else {
      return null;
    }
  }

  const handleAttendanceCheck = async () => {
    console.log("handleAttendanceCheck");
    storeEthereumAddress(account!);

    if (account) {
      setLoading(true);
      try {
        const tx = await rewardContract.markAttendance();
        const receipt = await tx.wait();
        console.log({ receipt });
      } catch (error: any) {
        toast({
          title: "Oops! There was an error",
          description: error.message,
          status: "error",
          duration: 7000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
        toast({
          title: "Transaction Sent Successfully",
          status: "success",
          duration: 7000,
          isClosable: true,
        });
      }
    }
  };

  const TS = BigInt(1724764740);
  const userAddress = "0x74fe20bA35fcFb8E072013C64D3c169485364806";
  const triggerSupabase = async () => {
    // return;
    try {
      if (!account) return;
      const {
        data: { id },
        error,
      }: { data: any; error: any } = await supabase
        .from("users")
        .select("*")
        .eq("user_address", account)
        .single();
      if (!id) throw new Error("no user id");
      const { data } = await supabase.from("attendance").insert({
        user_id: id,
        attendance_dates: [dayjs(Number(TS) * 1000).format()],
      });
      console.log({ data });
    } catch (e) {
      console.log("e", e);
    }
  };
  const callSupa = async () => {
    if (!account) return;
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_address", account)
      .single();
    console.log("supa::", data);
  };
  const onAttendanceMarked = async (_: string, timestamp: BigInt) => {
    if (!account) return;
    try {
      console.log("onAttendanceMarked called");
      setLoading(true);

      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_address", account)
        .single();

      if (!userData) throw new Error("no user id");

      if (error) {
        throw error;
      }
      // 유저의 attendance 데이터 조회
      const { data: attendanceRow } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", userData.id)
        .single();
      console.log({ attendanceRow });
      if (attendanceRow?.attendance_dates) {
        const { data } = await supabase
          .from("attendance")
          .update({
            attendance_dates: [
              ...attendanceRow?.attendance_dates,
              dayjs(Number(timestamp) * 1000).format(),
            ],
          })
          .eq("id", account);
        const ret = makeAttendanceData([
          ...attendanceRow?.attendance_dates,
          dayjs(Number(timestamp) * 1000).format(),
        ]);
        setAttendanceObject(ret);
        console.log({ data });
      } else {
        const { data } = await supabase.from("attendance").insert({
          user_id: userData.id,
          attendance_dates: [dayjs(Number(timestamp) * 1000).format()],
        });
        const ret = makeAttendanceData([
          dayjs(Number(timestamp) * 1000).format(),
        ]);
        setAttendanceObject(ret);
        console.log({ data });
      }
    } catch (e) {
      console.error("Error checking attendance:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!rewardContract) return;

    rewardContract.on("AttendanceMarked", onAttendanceMarked);
    // Clean up the event listener when the component unmounts or dependencies change
    return () => {
      rewardContract.off("AttendanceMarked");
    };
  }, [rewardContract]);

  return (
    <Box w="full">
      <section>
        <Flex bgColor={"cream"}>
          <Box
            backgroundImage="url('/assets/peaches.jpg')"
            height={"400px"}
            width={"200px"}
            backgroundPosition={"-40px 0"}
            backgroundSize={"cover"}
          ></Box>
          <Box pt={10} pl={4}>
            <Button onClick={uploadToSupabase}>Upload Attendance</Button>
            <Button onClick={triggerSupabase}>Upload One Attendance</Button>
            <Heading
              style={{
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
              bgGradient="linear(135deg, pink.500, yellow.200, pink.400)"
              textShadow={"1px 1px 1px rgba(130, 130, 130, 0.1)"}
              fontFamily={"Outfit Variable"}
              fontWeight={"bold"}
              fontSize={"xxx-large"}
            >
              Daily Check-in Event
            </Heading>
            <Button onClick={callSupa}>supa DUPAA</Button>
            <Box mt={10}>
              <Text fontSize={"x-large"} color={"gray.800"} mt={4}>
                Receive 0.1 BSM for checking in each day.
              </Text>
              <Text mt={4}>
                If you check in for{" "}
                <span style={{ fontSize: 22 }}>7 consecutive days</span>, an
                additional 0.3 BSM will be rewarded on the 7th day, for a total
                of
                <span style={{ fontSize: 22 }}>1 BSM</span> .
              </Text>
              <Text mt={4}>
                {" "}
                If you check in for{" "}
                <span style={{ fontSize: 22 }}> 28 consecutive days</span>, an
                additional 1 BSM will be rewarded on the 28th day, for a total
                of
                <span style={{ fontSize: 22 }}> 5 BSM</span>.
              </Text>{" "}
            </Box>
            <Text color="gray.800" mt={4}>
              <span style={{ color: "#ff2c2c" }}> *</span> A minimum of 1000 BSM
              staking is required to participate in the check-in event.
            </Text>
          </Box>{" "}
        </Flex>
      </section>
      <section>
        <Flex
          mb={"120px"}
          py={10}
          flexDir={"column"}
          alignItems={"center"}
          bgGradient={"linear(to-t, white, mint, white)"}
          justifyContent={"center"}
        >
          {
            <Calendar
              tileDisabled={() => true}
              tileContent={tileRender}
              locale="en-US"
              className={"custom-calendar"}
            />
          }
          <Button
            mt={6}
            colorScheme="yellow.400"
            onClick={handleAttendanceCheck}
            disabled={loading || hasMarkedToday}
            cursor={hasMarkedToday ? "not-allowed" : "pointer"}
          >
            {loading
              ? "Processing..."
              : hasMarkedToday
              ? "Checked-in for Today!"
              : "Mark Attendance"}
          </Button>
        </Flex>
      </section>
      <LoaderModal isOpen={loading} setIsModalOpen={setLoading} />
    </Box>
  );
};

export default Page;
