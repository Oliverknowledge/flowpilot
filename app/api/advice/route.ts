"use server";

import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { getServerSession } from "next-auth";
import { config } from "@/auth";
import connectDB from "@/lib/mongodb";
import Notification from "@/models/Notification";
import ChatHistory from "@/models/ChatHistory";
import dbConnect from "@/lib/dbConnect";

// ⛳️ Init OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🎯 Generate AI advice and save to chat history
export async function POST(req: Request) {
  try {
    const session = await getServerSession(config);
    
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { message, chatId, walletAddress } = body;
    
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }
    
    // 1. 🧠 Generate AI response with OpenAI
    let aiResponse;
    let responseText;
    
    try {
      aiResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a DeFi AI agent. Parse intent and suggest a strategy.",
          },
          {
            role: "user",
            content: message,
          },
        ],
      });
      
      responseText = aiResponse.choices[0].message.content ?? "No output";
      console.log("AI Response:", responseText);
    } catch (error) {
      console.error("Error generating AI response:", error);
      // Fallback response if OpenAI API fails
      responseText = "I'm sorry, I couldn't generate a response at the moment. Please try again later.";
    }

    // 2. 📝 Save to chat history if chat ID is provided
    if (chatId && session.user?.email) {
      try {
        await dbConnect();
        
        // Find the chat history
        let chatHistory = await ChatHistory.findOne({ 
          chatId,
          userEmail: session.user.email
        });
        
        // If it doesn't exist, create a new one
        if (!chatHistory) {
          chatHistory = new ChatHistory({
            chatId,
            userId: session.user.id || session.user.email,
            userEmail: session.user.email,
            walletAddress,
            title: message.length > 30 ? message.substring(0, 30) + '...' : message,
            messages: [
              // Add the user message first (if not already saved by the client)
              {
                id: Date.now().toString(),
                content: message,
                role: 'user',
                timestamp: new Date()
              }
            ]
          });
        }
        
        // Add the AI response
        chatHistory.messages.push({
          id: (Date.now() + 1).toString(),
          content: responseText,
          role: 'ai',
          timestamp: new Date()
        });
        
        await chatHistory.save();
      } catch (error) {
        console.error("Error saving to chat history:", error);
        // Continue even if saving fails
      }
    }
    
    // 3. 📢 Create a notification about this advice using existing Notification model
    try {
      await connectDB();
      await Notification.create({
        userId: session.user.id || 'unknown',
        email: session.user.email,
        title: 'New Strategy Advice',
        message: `The AI provided advice on: "${message.substring(0, 60)}${message.length > 60 ? '...' : ''}"`,
        type: 'info',
        source: 'bot',
        read: false
      });
    } catch (error) {
      console.error("Error creating notification:", error);
      // Continue even if notification creation fails
    }

    // Return advice to the client
    return NextResponse.json({
      success: true,
      response: responseText,
      intent: "analyze" // Default intent
    });
  } catch (error: any) {
    console.error("Error generating advice:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate advice" },
      { status: 500 }
    );
  }
}
