import supabase from "@/lib/supabaseClient";
import { ethers } from "hardhat";

async function foo() {
  const { data: userId, error } = await supabase
    .from("users")
    .select("*")
    .eq("user_address", userAddress)
    .single();
}
