import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest, res: NextResponse) => {
  if (req.method === "GET") {
    const searchParams = new URL(req.url).searchParams;

    const latitude = Number(searchParams.get("latitude")) || 0;
    const longitude = Number(searchParams.get("longitude")) || 0;

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    const res = await axios.get(url);

    return Response.json(res.data);
  }
};
