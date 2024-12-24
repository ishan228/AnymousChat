import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User.model";

import { z } from "zod";

// todo: optimize the usernameValidation due to import error from signupSchema
const usernameValidation = z
  .string()
  .min(3, "Username must be atleast 3 characters")
  .max(20, "Username must be no more than 20 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers, and underscores"
  );

const UsernameQuerySchema = z.object({
  username: usernameValidation,
});

export async function GET(req: Request) {


  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const queryParam = {
      username: searchParams.get("username") || "",
    };

    const { success, data, error } = UsernameQuerySchema.safeParse(queryParam);

    if (!success) {
      const usernameErrors = error.format().username?._errors || [];
      return new Response(
        JSON.stringify({ success: false, message: usernameErrors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { username } = data;

    const existingVerifiedUser = await UserModel.findOne({
      username,
      isVerified: true,
    });

    if (existingVerifiedUser) {
      return new Response(
        JSON.stringify({ success: false, message: "User already exists" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Username is unique" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in checking username:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Error in checking username" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
