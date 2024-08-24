"use client";

import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import Web3 from "web3";
import supabase from "../../lib/supabaseClient";
import RewardABI from "@/abi/Reward.json";
import "react-calendar/dist/Calendar.css";
import { rewardContractAddress } from "@/constants";
import styles from "../../styles/CalendarComponent.module.css";

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
    return attendance[formattedDate] ? styles.present : "";
  };

  const tileContent = ({ date }: { date: Date }) => {
    const formattedDate = date.toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];
    return attendance[formattedDate] ? (
      <div className={styles.stamp}>
        {formattedDate === today ? "Complete" : "✓"}
      </div>
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
    <div className={styles.calendarContainer}>
      <div className={styles.headerText}>Daily Check</div>
      <Calendar
        onChange={handleDateChange as (value: any) => void}
        value={value}
        tileClassName={tileClassName}
        tileDisabled={tileDisabled}
        tileContent={tileContent}
        locale="en-US"
        className={styles.reactCalendar}
      />
      <button
        onClick={handleAttendanceCheck}
        disabled={loading || hasMarkedToday}
        className={styles.attendanceButton}
      >
        {loading
          ? "Processing..."
          : hasMarkedToday
          ? "Already Checked"
          : "Mark Attendance"}
      </button>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default CalendarComponent;
