import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import {v2 as cloudinary} from "cloudinary";

export const getUserProfile = async (req, res) => {
    try {
    const {username} = req.params;

    const user = await User.findOne({username}).select("-password")

    if(!user) return res.status(404).json({error: "User not found"})
    
    res.status(200).json(user);
    }
    catch(error){
        console.log("Error in getting user profile", error.message);
        res.status(500).json({error: error.message})
    }
}
export const followUnfollowUser = async(req, res)=>{
    try{
        const {id} = req.params;

        const userToModify = await User.findById(id);
        const currentUser = await User.findById(req.user._id);

        if(id === req.user._id.toString()) return res.status(400).json({error: "You can't follow/unfollow yourself"})
        
        if(!userToModify || !currentUser) return res.status(404).json({error: "User not found"})

        const isFollowing = currentUser.following.includes(id);

        if(isFollowing){
            //unfollow the user
            await User.findByIdAndUpdate(req.user._id, {$pull: {following: id}});
            await User.findByIdAndUpdate(id, {$pull: {followers: req.user._id}});
            res.status(200).json({
                message: "User unfollowed successfully",
            })
        }else{
            //follow the user
            await User.findByIdAndUpdate(id,{$push: {followers: req.user._id}});
            await User.findByIdAndUpdate(req.user._id,{$push: {following: id}});

            //send a notification to the user
            const notification = new Notification({
                type: "follow",
                from : req.user._id,
                to: userToModify._id
            });
            await notification.save();

            res.status(200).json({
                message: "User followed successfully",
            })
        }

    }
    catch(error){
        console.log("Error in follow unfollow user", error.message);
        res.status(500).json({
            error: error.message
        })
    }
}
export const getSuggestedUsers = async(req, res)=>{
    try {
        const userId = req.user._id;
        const usersFollowedByMe = await User.findById(userId).select("following");

        const users = await User.aggregate([
            {
                $match: {
                    _id: { $ne: userId },
                },
            },
                {   $sample :{size :10}},
        ]);

        const filteredUsers = users.filter((user) => !usersFollowedByMe.following.includes(user._id));
        const suggestedUsers = filteredUsers.slice(0,4);

        suggestedUsers.forEach((user)=>(user.password = null));
        res.status(200).json({
            suggestedUsers: suggestedUsers
        })
    } catch (error) {
        console.log("Error in getSuggestedUsers", error.message);
        res.status(500).json({error: error.message});
        
    }
}
export const updateUser = async(req, res)=>{
    const {fullName, email, username, currentPassword, newPassword, link, bio} = req.body;
    let {profileImg, coverImg} = req.body;
    const userId = req.user._id;

    try {
        let user = await User.findById(userId);
        if(!user){
            return res.status(404).json({message: "User not found"});
        }
        if((!currentPassword && newPassword) || (currentPassword && !newPassword)){ 
            return res.status(400).json({message: "Current password and new password must be provided"})
        }
        if(currentPassword && newPassword){
            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if(!isValidPassword){
                return res.status(400).json({message: "Invalid current password"})
            }
            if(newPassword < 6){
                return res.status(400).json({message: "Password must be at least 6 characters"})
            }
            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            user.password = hashedPassword; 
        }
        if(profileImg){
            if(user.profileImg){
                await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0])
            }
            const uploadedResponse = await cloudinary.uploader.upload(profileImg);
            profileImg = uploadedResponse.secure_url;
        }
        if(coverImg){
            if(user.coverImg){
                await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0])
            }
            const uploadedResponse = await cloudinary.uploader.upload(coverImg);
            coverImg = uploadedResponse.secure_url;
        }
        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.bio = bio || user.bio;
        user.link = link || user.link;
        user.profileImg = profileImg || user.profileImg;
        user.coverImg = coverImg || user.coverImg;
        user.username = username || user.username;

        user = await user.save();


        //password should be null in response
        user.password = null;
        return res.status(200).json(user);

    } catch (error) {
        console.log(
            `Error updating user: ${error.message}`
        );
        return res.status(500).json({ message: "Error updating user" });
        
    }
}