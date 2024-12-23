import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User.model";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";

export async function POST(req: Request) {
  await dbConnect();
  try {
    const { username, email, password } = await req.json();
    const existingUserVerifiedByUsername = await UserModel.findOne({
      username,
      isVerified: true,
    });
    if (existingUserVerifiedByUsername) {
      return Response.json(
        { success: false, message: "User already exists" },
        { status: 400 }
      );
    }
    const existingUserbyEmail = await UserModel.findOne({ email });
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (existingUserbyEmail) {
      if (existingUserbyEmail.isVerified) {
        return Response.json(
          { success: false, message: "User already exists" },
          { status: 400 }
        );
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        existingUserbyEmail.password = hashedPassword;
        existingUserbyEmail.verifyCode = verifyCode;
        existingUserbyEmail.verifyCodeExpiry = new Date(Date.now() + 3600000);
        await existingUserbyEmail.save();
      }
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1);

      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
        verifyCode: verifyCode,
        verifyCodeExpiry: expiryDate,
        isVerified: false,
        isAcceptingMessage: true,
        messages: [],
      });
      await newUser.save();
    }
    //send verification email
    const emailResponse = await sendVerificationEmail(
      email,
      username,
      verifyCode
    );
    if (!emailResponse.success) {
      return Response.json(
        { success: false, message: "Error sending verification email" },
        { status: 500 }
      );
    }
    return Response.json(
      {
        success: true,
        message: "User registered successfully.Please verify your email",
      },
      { status: 500 }
    );
  } catch (error) {
    console.log("Error registering user", error);
    return Response.json(
      { success: false, message: "Error registering user" },
      { status: 500 }
    );
  }
}
