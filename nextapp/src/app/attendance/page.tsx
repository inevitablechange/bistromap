"use client";

import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import Web3 from "web3";
import supabase from "../../lib/supabaseClient";
import RewardABI from "@/abi/Reward.json";
import "react-calendar/dist/Calendar.css";
import { rewardContractAddress } from "@/constants";
import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import "./calendar.css";
interface AttendanceData {
  [key: string]: boolean;
}

const CalendarComponent: React.FC = () => {
  const [value, setValue] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<AttendanceData>({});
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [rewardContract, setRewardContract] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasMarkedToday, setHasMarkedToday] = useState<boolean>(false);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("date, is_present");

      if (error) {
        console.error("Error fetching attendance data:", error);
      } else {
        const attendanceMap: AttendanceData = {};
        data.forEach((record) => {
          attendanceMap[record.date] = record.is_present;
        });
        setAttendance(attendanceMap);
      }
    };

    fetchAttendanceData();
  }, []);

  useEffect(() => {
    const initWeb3 = async () => {
      if (
        typeof window !== "undefined" &&
        typeof window.ethereum !== "undefined"
      ) {
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          const contract = new web3Instance.eth.Contract(
            RewardABI,
            rewardContractAddress
          );
          console.log("contract::", contract);
          setRewardContract(contract);
        } catch (error) {
          console.error("Error initializing Web3:", error);
        }
      } else {
        console.error("Web3 is not available in the current environment.");
      }
    };

    initWeb3();
  }, []);

  useEffect(() => {
    const checkTodayAttendance = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("attendance")
        .select("is_present")
        .eq("date", today)
        .single();

      if (error) {
        console.error("Error fetching attendance status from Supabase:", error);
      } else {
        setHasMarkedToday(data?.is_present ?? false);
      }
    };

    checkTodayAttendance();
  }, []);

  const handleDateChange = async (value: Date | Date[] | null) => {
    if (Array.isArray(value) || value === null) return;

    const selectedDate = value as Date;
    const today = new Date();
    const formattedSelectedDate = selectedDate.toISOString().split("T")[0];
    const formattedToday = today.toISOString().split("T")[0];

    if (formattedSelectedDate !== formattedToday) {
      return; // Do not allow attendance marking for dates other than today
    }

    setValue(selectedDate);
    const isPresent = !attendance[formattedToday];

    setAttendance((prev) => ({
      ...prev,
      [formattedToday]: isPresent,
    }));

    if (rewardContract && web3) {
      setLoading(true);
      setMessage(null);
      try {
        const accounts = await web3.eth.getAccounts();
        await rewardContract.methods
          .markAttendance()
          .send({ from: accounts[0] });

        const { error } = await supabase
          .from("attendance")
          .upsert([{ date: formattedToday, is_present: isPresent }]);

        if (error) {
          console.error("Error updating attendance in Supabase:", error);
          setMessage("Error updating attendance in Supabase.");
        } else {
          setMessage("Attendance updated successfully in Supabase!");
          setHasMarkedToday(true); // Mark today's attendance as completed
        }
      } catch (error) {
        console.error("Error marking attendance:", error);
        setMessage("Error marking attendance.");
      } finally {
        setLoading(false);
      }
    }
  };

  const tileClassName = ({ date }: { date: Date }) => {
    const formattedDate = date.toISOString().split("T")[0];
    return "";
  };

  const tileContent = ({ date }: { date: Date }) => {
    const formattedDate = date.toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];
    return attendance[formattedDate] ? (
      <div>{formattedDate === today ? "Complete" : "✓"}</div>
    ) : null;
  };

  const tileDisabled = ({ date, view }: { date: Date; view: string }) => {
    const today = new Date();
    return view === "month" && date.toDateString() !== today.toDateString();
  };

  const handleAttendanceCheck = async () => {
    if (rewardContract && web3 && !hasMarkedToday) {
      setLoading(true);
      setMessage(null);
      try {
        const accounts = await web3.eth.getAccounts();
        await rewardContract.methods
          .markAttendance()
          .send({ from: accounts[0] });

        const { error } = await supabase
          .from("attendance")
          .upsert([
            { date: new Date().toISOString().split("T")[0], is_present: true },
          ]);

        if (error) {
          console.error("Error updating attendance in Supabase:", error);
          setMessage("Error updating attendance in Supabase.");
        } else {
          setMessage("Attendance updated successfully in Supabase!");
          setHasMarkedToday(true);
        }
      } catch (error) {
        console.error("Error marking attendance:", error);
        setMessage("Error marking attendance.");
      } finally {
        setLoading(false);
      }
    }
  };

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
          bgGradient={"linear(to-t, white, yellow.200, white)"}
          justifyContent={"center"}
        >
          <Calendar
            onChange={handleDateChange as (value: any) => void}
            value={value}
            tileClassName={tileClassName}
            tileDisabled={tileDisabled}
            tileContent={tileContent}
            locale="en-US"
            className={"custom-calendar"}
          />
          <Button
            mt={6}
            colorScheme="yellow.400"
            onClick={handleAttendanceCheck}
            disabled={loading || hasMarkedToday}
          >
            {loading
              ? "Processing..."
              : hasMarkedToday
              ? "Already Checked"
              : "Mark Attendance"}
          </Button>
          {message && <p>{message}</p>}
        </Flex>
      </section>
    </Box>
  );
};

export default CalendarComponent;
