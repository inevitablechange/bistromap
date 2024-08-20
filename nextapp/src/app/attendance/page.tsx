"use client";
import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
// import supabase from './supabaseClient';
import "react-calendar/dist/Calendar.css";

const data = [
  {
    id: "1a2b3c4d-5678-9101-1121-314151617181",
    user_id: "user-uuid-1",
    date: "2024-08-01",
    status: true,
  },
  {
    id: "1a2b3c4d-5678-9101-1121-314151617182",
    user_id: "user-uuid-1",
    date: "2024-08-02",
    status: false,
  },
];
interface AttendanceData {
  [key: string]: boolean;
}

const attendanceData: AttendanceData = data.reduce((acc: any, curr) => {
  acc[curr.date] = curr.status;
  return acc;
}, {});
const CalendarComponent = () => {
  const [value, setValue] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState(attendanceData);

  //   useEffect(() => {
  //     const fetchAttendance = async () => {
  //       const { data, error } = await supabase
  //         .from('attendance')
  //         .select('*')
  //         .eq('user_id', 'user-uuid'); // Replace with actual user ID
  //       if (error) {
  //         console.error(error);
  //       } else {
  //         const attendanceData = data.reduce((acc, curr) => {
  //           acc[curr.date] = curr.status;
  //           return acc;
  //         }, {});
  //         setAttendance(attendanceData);
  //       }
  //     };

  //     fetchAttendance();
  //   }, []);

  const handleDateChange = (date: any) => {
    setValue(date);
    const formattedDate = date.toISOString().split("T")[0];
    const isPresent = !attendanceData[formattedDate]; // Toggle status
    setAttendance((prev) => ({
      ...prev,
      [formattedDate]: isPresent,
    }));
    // setValue(date);
    //   const { data, error } = await supabase
    //     .from('attendance')
    //     .upsert({
    //       user_id: 'user-uuid', // Replace with actual user ID
    //       date: formattedDate,
    //       status: isPresent,
    //     })
    //     .eq('user_id', 'user-uuid')
    //     .eq('date', formattedDate);

    //   if (error) {
    //     console.error(error);
    //   } else {
    //     setAttendance((prev) => ({
    //       ...prev,
    //       [formattedDate]: isPresent,
    //     }));
    //   }
  };

  const tileClassName = ({ date }: { date: any }) => {
    const formattedDate = date.toISOString().split("T")[0];
    return attendance[formattedDate] ? "present" : "";
  };
  const dummy = [
    {
      id: "1a2b3c4d-5678-9101-1121-314151617181",
      user_id: "user-uuid-1",
      date: "2024-08-01",
      status: true,
    },
    {
      id: "1a2b3c4d-5678-9101-1121-314151617182",
      user_id: "user-uuid-1",
      date: "2024-08-02",
      status: false,
    },
    {
      id: "1a2b3c4d-5678-9101-1121-314151617183",
      user_id: "user-uuid-1",
      date: "2024-08-03",
      status: true,
    },
    {
      id: "1a2b3c4d-5678-9101-1121-314151617184",
      user_id: "user-uuid-2",
      date: "2024-08-01",
      status: true,
    },
    {
      id: "1a2b3c4d-5678-9101-1121-314151617185",
      user_id: "user-uuid-2",
      date: "2024-08-02",
      status: true,
    },
    {
      id: "1a2b3c4d-5678-9101-1121-314151617186",
      user_id: "user-uuid-2",
      date: "2024-08-03",
      status: false,
    },
    {
      id: "1a2b3c4d-5678-9101-1121-314151617187",
      user_id: "user-uuid-3",
      date: "2024-08-01",
      status: false,
    },
    {
      id: "1a2b3c4d-5678-9101-1121-314151617188",
      user_id: "user-uuid-3",
      date: "2024-08-02",
      status: true,
    },
  ];
  return (
    <div>
      <Calendar
        onChange={handleDateChange}
        value={value}
        tileClassName={tileClassName}
      />
    </div>
  );
};

export default CalendarComponent;
