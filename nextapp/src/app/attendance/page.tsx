"use client";

import React, { useState, useEffect } from "react";
import Calendar, { TileArgs } from "react-calendar";
import supabase from "../../lib/supabaseClient";
import RewardABI from "@/abi/Reward.json";
import "react-calendar/dist/Calendar.css";
import { useAccount } from "@/context/AccountContext";
import { rewardContractAddress } from "@/constants";
import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import "./calendar.css";
import { BrowserProvider, ethers, Signer } from "ethers";
import { FaCheck } from "react-icons/fa";
interface AttendanceData {
  [key: string]: number;
}
interface AttendancObject {
  [key: string]: number;
}

const Page: React.FC = () => {
  const [account, setAccount] = useState<string>("");
  const [attendanceObject, setAttendanceObject] = useState<AttendancObject>({});
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [rewardContract, setRewardContract] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasMarkedToday, setHasMarkedToday] = useState<boolean>(false);

  const {
    provider,
  }: { provider: BrowserProvider | null; signer: Signer | null } = useAccount();

  async function fetchUserAttendance() {
    if (!account || !rewardContract) return;
    try {
      console.log("fetch");
      // 스마트 계약과 상호작용하여 데이터 가져오기
      const data = await rewardContract.getUserAttendance();
      const dateArray = data.dates.map((el: BigInt) =>
        new Date(parseInt(el.toString()) * 1000).toISOString()
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
  }, []);

  useEffect(() => {
    fetchUserAttendance();
  }, []);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0"); // getMonth()는 0부터 시작하므로 +1 필요
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  function tileRender(content: TileArgs) {
    if (attendanceObject[formatDate(content.date)]) {
      setTimeout(() => {
        setHasMarkedToday(true);
      }, 0);
      return <FaCheck color="green" fontSize={24} />;
    } else {
      return null;
    }
  }
  const handleAttendanceCheck = async () => {
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
  const sendSupabase = async () => {
    await onAttendanceMarked();
  };
  const onAttendanceMarked = async () => {
    try {
      if (!account) return;
      setLoading(true);
      if (Array.isArray(attendanceData) && attendanceData.length == 0) {
        const { data, error } = await supabase.from("attendance").insert([
          {
            id: account,
            attendance_dates: [new Date()],
          },
        ]);

        if (error) {
          throw error;
        }
        console.log("New attendance record created:", data);
      } else if (Array.isArray(attendanceData) && attendanceData.length > 0) {
        const updatedAttendanceDates = [
          ...attendanceData,
          new Date().toISOString(),
        ];
        console.log("updated");
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
  useEffect(() => {
    if (!rewardContract || !account) return;
    rewardContract.on("AttendanceMarked", onAttendanceMarked);

    // Clean up the event listener when the component unmounts or dependencies change
    return () => {
      rewardContract.off("AttendanceMarked", onAttendanceMarked);
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
            <Button onClick={sendSupabase}>attendance mark</Button>
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
          {message && <p>{message}</p>}
        </Flex>
      </section>
    </Box>
  );
};

export default Page;
