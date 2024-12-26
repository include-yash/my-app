import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";

export const signup = async (req, res) => {
    console.log("Signup controller called");

    console.log(req.body);

    const {username, fullName, email, password} = req.body;

    //check if email is valid
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email address" });
    }

    //check if username or email already exists
        const existingUsername = await User.findOne({ username });
    if (existingUsername) {
        return res.status(400).json({ error: "Username already exists" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
    }

    //hash password
    if(password.length < 6){
        return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //create a user object
    const newUser = new User({
        username: username,
        fullName: fullName,
        email: email,
        password: hashedPassword
    });

    if(newUser){
        generateTokenAndSetCookie(newUser._id,res)
        await newUser.save();

        res.status(201).json({
            id: newUser._id,
            fullName:newUser.fullName,
            email:newUser.email,
            username:newUser.username,
            followers: newUser.followers,
            following: newUser.following,
            profileImg: newUser.profileImg,
            coverImg: newUser.coverImg,
        })
    }else{
        console.log("Error in signup controller");
        
        res.status(400).json({
            error: "Failed to create user"
        })
    }


}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Email not found" });
        }
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ error: "Invalid password" });
            }
        
        generateTokenAndSetCookie(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            username: user.username,
            followers: user.followers,
            following: user.following,
            profileImg: user.profileImg,
            coverImg: user.coverImg,  
        })
    } catch (error) {
        console.log("Error in Login controller", error.message);
        res.status(400).json({
            error: "Failed to login user"
            })
        
    }
}

export const logout = async (req, res) => {
    try {
        res.cookie("jwt","",{maxAge:0})
        res.status(200).json({message: "Logged out successfully"})
    } catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(400).json({
            error: "Failed to logout user"
            })
    }
}

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Error in getMe controller:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
