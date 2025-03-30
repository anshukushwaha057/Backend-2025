import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js"
import mongoose from "mongoose";

const subscribe = asyncHandler(async (req, res) => {
    const userId = req.user?._id
    const { channelId } = req.body

    if (!(userId && channelId)) {
        throw new ApiError(400, "channelId OR userId is missing")
    }

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID format");
    }

    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const existSubscriber = await Subscription.exists({
        subscriber: userId,
        channel: channelId
    })

    if (existSubscriber) {
        await Subscription.deleteOne({ subscriber: userId, channel: channelId })

        return res.status(200)
            .json(
                new ApiResponse(200, {}, `You Unsubscribe ${channelId} successfully`)
            )
    }

    await Subscription.create({
        subscriber: userId,
        channel: channelId
    })

    return res.status(200)
        .json(
            new ApiResponse(200, {}, `Subscribe ${channelId} successfully`)
        )
})






export { subscribe }