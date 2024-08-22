// ethereumAddressHandler.ts
import supabase from "@/app/supabaseClient";

// Define the function to store Ethereum address
export async function storeEthereumAddress(_address: string) {
  try {
    // Check if the address already exists
    const { data: existingUserss, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("address", _address);

    if (fetchError) {
      console.error("Error fetching profile:", fetchError);
    } else if (existingUserss.length === 0) {
      // Handle the case where no rows are returned
      console.log("No profile found for the Ethereum address.");
      // Insert the new address
      const { data, error } = await supabase
        .from("users")
        .insert([{ address: _address }]);

      if (error) {
        console.error("Error inserting address:", error);
      } else {
        console.log("Ethereum address stored:", data);
      }
    } else {
      // Handle the case where one or more rows are returned
      const existingUsers = existingUserss[0];
      console.log("User found:", existingUsers);
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}
