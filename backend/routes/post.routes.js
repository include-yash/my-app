import express from 'express';
import { protectedRoute } from '../middleware/protectedRoute.js';
import { commentOnPost, createPost, deletePost, getAllPosts, getFollowingPosts, getLikedPosts, getUserPost, likeUnlikePost } from '../controllers/post.controller.js';


const router = express.Router();

router.post("/create",protectedRoute,createPost)
router.delete("/:id", protectedRoute, deletePost)
router.post("/comment/:id",protectedRoute,commentOnPost)
router.post("/like/:id",protectedRoute,likeUnlikePost)
router.get("/all",protectedRoute,getAllPosts)
router.get("/likes/:id", protectedRoute,getLikedPosts)
router.get("/following",protectedRoute, getFollowingPosts)
router.get("/user/:username",protectedRoute,getUserPost)

export default router;