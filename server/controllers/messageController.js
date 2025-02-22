import asyncHandler from "express-async-handler";
import { MessageModel } from "../models/MessageModel.js";
import { io, getReceiverSocketId } from "../utils/socket.js";


export const allMessages = asyncHandler(async (req, res) => {
    try {
      
        console.log("Request Body:", req.body);

       
        const { userToChatId } = req.body;
        const myId = req.user._id;

       
        console.log("myId:", myId);
        console.log("userToChatId:", userToChatId);

       
        
        const messages = await MessageModel.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ],
        });

       
        console.log("Messages found:", messages);

       
        if (!messages || messages.length === 0) {
            console.log("No messages found for this conversation.");
            return res.json({ messages: "Not found any message" });
        }

      
        res.status(200).json(messages);
    } catch (error) {
       
        console.log("Error in getMessages controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

export const sendMessage = asyncHandler(async (req, res) => {
    try {

        const senderId = req.user._id;
        const { content, receiverId } = req.body;


        console.log("Sender ID:", senderId);
        console.log("Receiver ID:", receiverId);
        console.log("Message Content:", content);


        if (!senderId || !receiverId || !content) {
            return res.status(400).json({ error: "All fields (senderId, receiverId, content) are required." });
        }


        const newMessage = new MessageModel({
            senderId,
            receiverId,
            content,
        });


        await newMessage.save();

        // Emit the message to the receiver if they're online
        const receiverSocketId = getReceiverSocketId(receiverId);

        console.log("Receiver Socket ID:", receiverSocketId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }
        if (!receiverSocketId) {
            console.log("Receiver is offline or not connected.");
            return res.status(404).json({ error: "Receiver is offline or not connected." });
        }


        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

