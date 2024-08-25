"use client";

import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import supabase from "../../lib/supabaseClient";
import RewardABI from "@/abi/Reward.json";
import "react-calendar/dist/Calendar.css";
import { useAccount } from "@/context/AccountContext";
import { rewardContractAddress } from "@/constants";
import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import "./calendar.css";
import { BrowserProvider, ethers, Provider, Signer } from "ethers";
import { FaCheck } from "react-icons/fa";
interface AttendanceData {
  [key: string]: number;
}

const CalendarComponent: React.FC = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [account, setAccount] = useState<string>("");
  const [rewardContract, setRewardContract] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasMarkedToday, setHasMarkedToday] = useState<boolean>(false);

  const {
    provider,
  }: {
    account: string | null;
    signer: Signer | null;
    provider: BrowserProvider | null;
  } = useAccount();

  useEffect(() => {
    if (!account) return;
    const getAttendance = async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("id", account)
        .maybeSingle();
      console.log({ data });
      if (data && data.attendance_dates) {
        const ret = makeAttendanceData(data.attendance_dates);
        setAttendanceData(ret);
      }
      if (error) {
        console.error(error);
      }
    };
    getAttendance();
  }, [account]);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0"); // getMonth()는 0부터 시작하므로 +1 필요
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const makeAttendanceData = (attendanceDates: string[]) => {
    const obj: AttendanceData = {};
    for (let date of attendanceDates) {
      const key: string = formatDate(new Date(date));
      obj[key] = 1;
    }
    return obj;
  };
  const tileContent = ({ date }: { date: Date }) => {
    if (attendanceData[formatDate(date)]) {
      console.log({ thiisDate: date });
      if (formatDate(new Date()) === formatDate(date)) {
        setHasMarkedToday(true);
      }
      return <FaCheck color="green" fontSize={24} />;
    } else {
      return null;
    }
  };

  // const checkAttendance = async () => { // upload 실패시 수동으로 사용
  //   if (!rewardContract) {
  //     console.log("no reward c");
  //     return;
  //   }
  //   const { dates, consecutive } = await rewardContract.getUserAttendance();
  //   console.log("data from::", dates, consecutive);
  //   Array.isArray(attendanceData.attendance_dates) &&
  //     attendanceData.attendance_dates.length == 0;
  //   const timestamp = dates[0];
  //   console.log({ timestamp });
  //   const { data, error } = await supabase.from("attendance").insert([
  //     {
  //       id: account,
  //       attendance_dates: [new Date(parseInt(timestamp.toString()) * 1000)],
  //     },
  //   ]);

  //   if (error) {
  //     throw error;
  //   }
  //   console.log("New attendance record created:", data);
  // };

  const handleAttendanceCheck = async () => {
    console.log("handleAttendanceCheck");
    if (account) {
      setLoading(true);
      setMessage(null);
      try {
        rewardContract.markAttendance();
      } catch (error) {
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const accountGetter = async () => {
      if (!provider) return;
      const signer = await provider.getSigner();
      const acc = await signer.getAddress();
      setAccount(acc);
      const rewardContract = new ethers.Contract(
        rewardContractAddress,
        RewardABI,
        signer
      );

      setRewardContract(rewardContract);
    };
    accountGetter();
  }, [provider]);
  useEffect(() => {
    if (!rewardContract || !account) return;
    const onAttendanceMarked = async (_: string, timestamp: BigInt) => {
      try {
        setLoading(true);
        if (
          Array.isArray(attendanceData.attendance_dates) &&
          attendanceData.attendance_dates.length == 0
        ) {
          const { data, error } = await supabase.from("attendance").insert([
            {
              id: account,
              attendance_dates: [
                new Date(parseInt(timestamp.toString()) * 1000),
              ],
            },
          ]);

          if (error) {
            throw error;
          }
          console.log("New attendance record created:", data);
        } else if (
          Array.isArray(attendanceData.attendance_dates) &&
          attendanceData.attendance_dates.length > 0
        ) {
          const updatedAttendanceDates = [
            ...attendanceData.attendance_dates,
            new Date(parseInt(timestamp.toString()) * 1000),
          ];
          const { data, error } = await supabase
            .from("attendance")
            .update({ attendance_dates: updatedAttendanceDates })
            .eq("id", account);

          if (error) {
            throw error;
          }
          console.log("Attendance record updated:", data);
        }
      } catch (e) {
        console.error("Error checking attendance:", e.message);
      } finally {
        setLoading(false);
      }
    };
    rewardContract.on("AttendanceMarked", onAttendanceMarked);

    // Clean up the event listener when the component unmounts or dependencies change
    return () => {
      rewardContract.off("AttendanceMarked", onAttendanceMarked);
    };
  }, [rewardContract]);

  return (
    <Box w="full">
      <section>
        <Button onClick={checkAttendance}>CheckAttendance</Button>
        <Flex bgColor={"cream"}>
          <Box
            backgroundImage="url('/assets/peaches.jpg')"
            height={"400px"}
            width={"200px"}
            backgroundPosition={"-40px 0"}
            backgroundSize={"cover"}
          ></Box>
          <Box pt={10} pl={4}>
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
          <Calendar
            tileDisabled={() => true}
            tileContent={tileContent}
            locale="en-US"
            className={"custom-calendar"}
          />
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
          {message && <p>{message}</p>}
        </Flex>
      </section>
    </Box>
  );
};

export default CalendarComponent;
