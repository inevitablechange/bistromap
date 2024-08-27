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
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [rewardContract, setRewardContract] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMarkedToday, setHasMarkedToday] = useState<boolean>(false);
  const [supabaseData, setSupabaseData] = useState<SupabaseData>({
    id: "",
    attendance_dates: [],
  });
  const {
    account,
    provider,
    signer,
  }: {
    account: string | null;
    provider: BrowserProvider | null;
    signer: Signer | null;
  } = useAccount();

  var now = dayjs(1724673816000).format();
  console.log(now);

  async function fetchUserAttendance() {
    if (!account || !rewardContract) return;
    try {
      console.log("fetch");
      // 스마트 계약과 상호작용하여 데이터 가져오기
      const data = await rewardContract.getUserAttendance();
      const dateArray = data.dates.map(
        (el: BigInt) => dayjs(Number(el) * 1000).format
      );
      setAttendanceData(dateArray);
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
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("id", account)
      .maybeSingle();
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
      if (account) {
        setLoading(true);
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
          // const { data, error } = await supabase.from("attendance").insert([
          //   {
          //     id: account,
          //     attendance_dates: dateArr,
          //   },
          // ]);
          if (!Array.isArray(supabaseData.attendance_dates))
            throw new Error("There is discrepancy in data");
          const updatedAttendanceDates = [
            ...supabaseData.attendance_dates,
            dayjs(timestamps[timestamps.length - 1]).format(),
          ];
          const { data, error } = await supabase
            .from("attendance")
            .update({ attendance_dates: updatedAttendanceDates })
            .eq("id", account);
          if (data) {
            console.log("success::", data);
          }
          if (error) throw error;
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

  const onAttendanceMarked = async (userAddress: string, timestamp: BigInt) => {
    try {
      console.log("handler called", userAddress, timestamp);
      setAttendanceData((prev) => {
        prev[new Date(Number(timestamp) * 1000).toString()] = 1;
        return prev;
      });
      new Date(Number(timestamp) * 1000);
      setLoading(true);
      if (Object.keys(attendanceObject).length === 0) {
        // @ts-ignore
        const { data, error } = await supabase.from("attendance").insert([
          {
            id: userAddress,
            attendance_dates: [dayjs(Number(timestamp) * 1000).format],
          },
        ]);

        if (error) {
          throw error;
        }
        console.log("New attendance record created:", data);
      } else {
        if (!Array.isArray(supabaseData.attendance_dates))
          throw new Error("There is discrepancy in data");
        const updatedAttendanceDates = [
          ...supabaseData.attendance_dates,
          dayjs(Number(timestamp) * 1000).format(),
        ];
        const { data, error } = await supabase
          .from("attendance")
          .update({ attendance_dates: updatedAttendanceDates })
          .eq("id", userAddress);

        if (error) {
          throw error;
        }
        console.log("Attendance record updated:", data);
      }
    } catch (e) {
      console.error("Error checking attendance:", e);
    } finally {
      setLoading(false);
      console.log({ userAddress });
      console.log({ account });
      getAttendance(userAddress);
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
