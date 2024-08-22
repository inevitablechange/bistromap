"use client";

import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import Web3 from "web3";
import supabase from "../supabaseClient";
import RewardABI from "@/abi/Reward.json";
import "react-calendar/dist/Calendar.css";
import { rewardContractAddress } from "@/constants";
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

  const handleDateChange = async (value: Date | Date[] | null) => {
    if (Array.isArray(value) || value === null) return;

    const selectedDate = value as Date;
    setValue(selectedDate);
    const formattedDate = selectedDate.toISOString().split("T")[0];
    const isPresent = !attendance[formattedDate];

    setAttendance((prev) => ({
      ...prev,
      [formattedDate]: isPresent,
    }));

    if (rewardContract && web3) {
      setLoading(true);
      setMessage(null);
      try {
        const accounts = await web3.eth.getAccounts();
        console.log("accounts::", accounts);
        await rewardContract.methods
          .markAttendance()
          .send({ from: accounts[0] });

        // Mark attendance in Supabase
        const { error } = await supabase
          .from("attendance")
          .upsert([{ date: formattedDate, is_present: isPresent }]);

        if (error) {
          console.error("Error updating attendance in Supabase:", error);
          setMessage("Error updating attendance in Supabase.");
        } else {
          setMessage("Attendance updated successfully in Supabase!");
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
    return attendance[formattedDate] ? "present" : "";
  };

  const tileDisabled = ({ date, view }: { date: Date; view: string }) => {
    const today = new Date();
    return view === "month" && date.toDateString() !== today.toDateString();
  };

  const handleAttendanceCheck = async () => {
    if (rewardContract && web3) {
      setLoading(true);
      setMessage(null);
      try {
        const accounts = await web3.eth.getAccounts();
        await rewardContract.methods
          .markAttendance()
          .send({ from: accounts[0] });

        // Mark attendance in Supabase
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
    <div>
      <Calendar
        onChange={handleDateChange as (value: any) => void} // Cast to any to bypass type error
        value={value}
        tileClassName={tileClassName}
        tileDisabled={tileDisabled} // Disable all dates except today
      />
      <button onClick={handleAttendanceCheck} disabled={loading}>
        {loading ? "Processing..." : ""}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default CalendarComponent;
