"use server";

import { getServerSession } from "next-auth";
import { config } from "@/auth";
import { NextResponse } from "next/server";
import ChatHistory from "@/models/ChatHistory";
import dbConnect from "@/lib/dbConnect";

// Get all chat histories for a user
export async function GET(req: Request) {
  try {
    const session = await getServerSession(config);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();
    
    // Get user's email from session
    const userEmail = session.user.email;
    
    // Extract search params (if any)
    const { searchParams } = new URL(req.url);
    
    // Find all chat histories for this user
    const chatHistories = await ChatHistory.find({ userEmail })
      .select('chatId title updatedAt')
      .sort({ updatedAt: -1 }) // Most recent first
      .lean();
    
    return NextResponse.json({
      success: true,
      chatHistories
    });
  } catch (error: any) {
    console.error("Error fetching chat histories:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch chat histories" },
      { status: 500 }
    );
  }
}

// Create a new chat history
export async function POST(req: Request) {
  try {
    const session = await getServerSession(config);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    await dbConnect();
    
    const body = await req.json();
    const { chatId, walletAddress, title, message } = body;
    
    // Validate input
    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }
    
    // Check if chat already exists
    let chatHistory = await ChatHistory.findOne({ chatId });
    
    // If it doesn't exist, create a new one
    if (!chatHistory) {
      chatHistory = new ChatHistory({
        chatId,
        userId: session.user.id || session.user.email,
        userEmail: session.user.email,
        walletAddress,
        title: title || 'New Chat',
        messages: []
      });
    }
    
    // If a message is provided, add it to the chat
    if (message) {
      const { content, role = 'user', signature, verified, txHash } = message;
      
      if (!content) {
        return NextResponse.json(
          { error: "Message content is required" },
          { status: 400 }
        );
      }
      
      chatHistory.messages.push({
        id: Date.now().toString(),
        content,
        role,
        timestamp: new Date(),
        signature,
        verified,
        txHash
      });
    }
    
    await chatHistory.save();
    
    return NextResponse.json({
      success: true,
      chatId: chatHistory.chatId
    });
  } catch (error: any) {
    console.error("Error creating chat history:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create chat history" },
      { status: 500 }
    );
  }
}
