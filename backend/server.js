const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs").promises;

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/static", express.static(path.join(__dirname, "../dist")));

// Track turn-taking state
let currentSpeaker = null;
let humanTurnCount = 0;
let currentConversationId = null;
let currentAgentIndex = 0; // 0: Nelson, 1: Taylor, 2: Michelle
let conversationContext = ""; // Store accumulated conversation context

app.get("/api/signed-url", async (req, res) => {
  try {
    const { opponent } = req.query;
    let agentId = process.env.AGENT_ID; // Default agent ID
      
    // Map opponent to specific agent ID based on current rotation
    const agentSequence = ['nelson', 'taylor', 'michelle'];
    const currentAgent = opponent || agentSequence[currentAgentIndex];
    
    if (currentAgent === 'michelle') {
      agentId = process.env.MICHELLE_AGENT_ID;
    } else if (currentAgent === 'nelson') {
      agentId = process.env.NELSON_AGENT_ID;
    } else if (currentAgent === 'taylor') {
      agentId = process.env.TAYLOR_AGENT_ID;
    } else if (currentAgent === 'singapore_uncle') {
      agentId = process.env.SINGAPORE_UNCLE_AGENT_ID;
    }
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": process.env.XI_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get signed URL");
    }

    const data = await response.json();
    
    // Include conversation context if available
    let contextData = {};
    if (conversationContext) {
      contextData.context = conversationContext;
    }
    
    res.json({ 
      signedUrl: data.signed_url, 
      agentId,
      currentAgent,
      ...contextData
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to get signed URL" });
  }
});

//API route for getting Agent ID, used for public agents
app.get("/api/getAgentId", (req, res) => {
  const agentId = process.env.AGENT_ID;
  res.json({
    agentId: `${agentId}`,
  });
});

// Serve index.html for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// Webhook endpoint for turn-based conversation management
app.post("/webhook", express.json(), async (req, res) => {
  try {
    console.log("Webhook received:", req.body);
    
    const { conversation_id, agent_id } = req.body;
    currentConversationId = conversation_id;
    
    // Track who just finished speaking
    if (agent_id === process.env.NELSON_AGENT_ID) {
      currentSpeaker = 'human'; // After Nelson, it's human's turn
      console.log("Nelson finished speaking, waiting for human turn");
    } else if (agent_id === process.env.MICHELLE_AGENT_ID) {
      currentSpeaker = 'human'; // After Michelle, it's human's turn  
      console.log("Michelle finished speaking, waiting for human turn");
    } else if (agent_id === process.env.TAYLOR_AGENT_ID) {
      console.log("Taylor finished speaking, debate sequence complete");
      currentSpeaker = null; // End of sequence
    }
    
    console.log(`Current speaker: ${currentSpeaker}, Human turn count: ${humanTurnCount}`);
    
    res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Endpoint to detect when human starts speaking
app.post("/human-turn", express.json(), async (req, res) => {
  try {
    console.log("Human turn detected");
    currentSpeaker = 'human';
    humanTurnCount++;
    
    console.log(`Human turn count: ${humanTurnCount}`);
    
    // Trigger next AI agent based on turn count
    if (humanTurnCount === 1 && currentConversationId) {
      // Trigger Michelle after first human turn
      console.log("Starting Michelle after first human turn");
      await startNextAgentConversation(process.env.MICHELLE_AGENT_ID, currentConversationId);
    } else if (humanTurnCount === 2 && currentConversationId) {
      // Trigger Taylor after second human turn
      console.log("Starting Taylor after second human turn");
      await startNextAgentConversation(process.env.TAYLOR_AGENT_ID, currentConversationId);
    }
    
    res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("Human turn error:", error);
    res.status(500).json({ error: "Human turn processing failed" });
  }
});

// Reset turn tracking for new debates
app.post("/reset-turns", express.json(), async (req, res) => {
  try {
    currentSpeaker = null;
    humanTurnCount = 0;
    currentConversationId = null;
    currentAgentIndex = 0;
    conversationContext = "";
    console.log("Turn tracking reset");
    res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("Reset turns error:", error);
    res.status(500).json({ error: "Reset turns failed" });
  }
});

// New endpoint to transfer to next agent
app.post("/transfer-agent", express.json(), async (req, res) => {
  try {
    const { conversationId } = req.body;
    
    console.log('Transfer agent request received:', { conversationId, currentAgentIndex });
    
    if (!conversationId) {
      console.error('No conversation ID provided in transfer request');
      return res.status(400).json({ 
        error: "Conversation ID is required",
        debug: {
          receivedBody: req.body,
          currentAgentIndex,
          availableConversations: "Check if conversation was properly initiated"
        }
      });
    }
    
    console.log(`Transferring from agent index ${currentAgentIndex} for conversation ${conversationId}`);
    
    // Extract conversation context from current conversation
    let conversationData;
    try {
      conversationData = await extractConversationContext(conversationId);
    } catch (extractError) {
      console.error('Failed to extract conversation context:', extractError);
      return res.status(500).json({ 
        error: "Failed to extract conversation context: " + extractError.message,
        debug: {
          conversationId,
          extractError: extractError.message
        }
      });
    }
    
    // Append to conversation context file
    try {
      await appendConversationToFile(conversationData);
    } catch (appendError) {
      console.error('Failed to append conversation to file:', appendError);
      // Continue even if file writing fails
    }
    
    // Move to next agent in sequence
    currentAgentIndex = (currentAgentIndex + 1) % 3; // Nelson(0) -> Taylor(1) -> Michelle(2) -> Nelson(0)
    
    const agentNames = ['nelson', 'taylor', 'michelle'];
    const nextAgent = agentNames[currentAgentIndex];
    
    // Get agent ID for next agent
    let nextAgentId;
    if (nextAgent === 'nelson') {
      nextAgentId = process.env.NELSON_AGENT_ID;
    } else if (nextAgent === 'taylor') {
      nextAgentId = process.env.TAYLOR_AGENT_ID;
    } else if (nextAgent === 'michelle') {
      nextAgentId = process.env.MICHELLE_AGENT_ID;
    }
    
    if (!nextAgentId) {
      return res.status(500).json({ 
        error: `No agent ID configured for ${nextAgent}`,
        debug: { nextAgent, currentAgentIndex }
      });
    }
    
    // Get signed URL for next agent
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${nextAgentId}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": process.env.XI_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get signed URL for next agent: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log(`Successfully transferred to ${nextAgent} (index ${currentAgentIndex})`);
    
    res.status(200).json({ 
      status: "success",
      nextAgent,
      agentId: nextAgentId,
      signedUrl: data.signed_url,
      conversationContext: conversationContext,
      debug: {
        previousConversationId: conversationId,
        newAgentIndex: currentAgentIndex,
        contextLength: conversationContext.length
      }
    });
  } catch (error) {
    console.error("Transfer agent error:", error);
    res.status(500).json({ 
      error: "Agent transfer failed: " + error.message,
      debug: {
        errorStack: error.stack,
        currentAgentIndex,
        receivedBody: req.body
      }
    });
  }
});

// Function to extract conversation context from ElevenLabs API
async function extractConversationContext(conversationId) {
  try {
    console.log(`Extracting conversation context for ${conversationId}`);
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
      {
        headers: {
          "xi-api-key": process.env.XI_API_KEY
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch conversation: ${response.status}`);
    }
    
    const conversationData = await response.json();
    console.log(`Retrieved conversation with ${conversationData.transcript?.length || 0} messages`);
    
    return conversationData;
  } catch (error) {
    console.error("Error extracting conversation context:", error);
    throw error;
  }
}

// Function to append conversation to text file and update context
async function appendConversationToFile(conversationData) {
  try {
    const contextFilePath = path.join(__dirname, 'conversation_context.txt');
    
    // Format the conversation for context
    let formattedConversation = `\n--- Conversation from Agent: ${conversationData.agent_id} ---\n`;
    formattedConversation += `Conversation ID: ${conversationData.conversation_id}\n`;
    formattedConversation += `Status: ${conversationData.status}\n`;
    formattedConversation += `Timestamp: ${new Date().toISOString()}\n\n`;
    
    if (conversationData.transcript && conversationData.transcript.length > 0) {
      formattedConversation += "TRANSCRIPT:\n";
      conversationData.transcript.forEach((message, index) => {
        formattedConversation += `[${message.time_in_call_secs}s] ${message.role}: ${message.message}\n`;
      });
    } else {
      formattedConversation += "No transcript available.\n";
    }
    
    formattedConversation += "\n" + "=".repeat(80) + "\n";
    
    // Append to file
    await fs.appendFile(contextFilePath, formattedConversation, 'utf8');
    
    // Update in-memory context for next agent
    conversationContext += formattedConversation;
    
    console.log(`Conversation context appended to ${contextFilePath}`);
    console.log(`Current context length: ${conversationContext.length} characters`);
  } catch (error) {
    console.error("Error appending conversation to file:", error);
    throw error;
  }
}

// Function to start conversation with next agent
// Updated function to start conversation with next agent (simpler version for turn-based)
async function startNextAgentConversation(nextAgentId, conversationId) {
  try {
    console.log(`Starting conversation with agent ${nextAgentId}`);
    
    // For turn-based system, we continue the same conversation rather than creating new ones
    // The context is already maintained within the same conversation
    
    // Get signed URL for the next agent to continue the conversation
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${nextAgentId}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": process.env.XI_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get signed URL for next agent");
    }

    const data = await response.json();
    console.log(`Next agent ${nextAgentId} can join with signed URL: ${data.signed_url}`);
    
    // In a real implementation, you would notify your frontend about the new agent
    // For now, we'll just log the success
    console.log(`Agent ${nextAgentId} is ready to join conversation ${conversationId}`);
    
    return { agentId: nextAgentId, signedUrl: data.signed_url, conversationId };
  } catch (error) {
    console.error("Error starting next agent conversation:", error);
    throw error;
  }
}

// API endpoint to get conversation history (useful for debugging)
app.get("/api/conversation/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
      {
        headers: {
          "xi-api-key": process.env.XI_API_KEY
        }
      }
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch conversation");
    }
    
    const conversationData = await response.json();
    res.json(conversationData);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

// API endpoint to get current conversation context
app.get("/api/conversation-context", (req, res) => {
  try {
    const agentNames = ['Nelson Mandela', 'Taylor Swift', 'Michelle Chong'];
    res.json({
      currentAgentIndex,
      currentAgent: agentNames[currentAgentIndex],
      conversationContext: conversationContext || "No conversation context available yet.",
      contextLength: conversationContext.length
    });
  } catch (error) {
    console.error("Error getting conversation context:", error);
    res.status(500).json({ error: "Failed to get conversation context" });
  }
});

// API endpoint to download conversation context file
app.get("/api/download-context", async (req, res) => {
  try {
    const contextFilePath = path.join(__dirname, 'conversation_context.txt');
    
    // Check if file exists
    try {
      await fs.access(contextFilePath);
      res.download(contextFilePath, 'conversation_context.txt');
    } catch (error) {
      res.status(404).json({ error: "No conversation context file found" });
    }
  } catch (error) {
    console.error("Error downloading context file:", error);
    res.status(500).json({ error: "Failed to download context file" });
  }
});

// API endpoint to get the most recent conversation ID (fallback for transfer)
app.get("/api/recent-conversation", async (req, res) => {
  try {
    // Get list of recent conversations from ElevenLabs
    const response = await fetch(
      'https://api.elevenlabs.io/v1/convai/conversations',
      {
        headers: {
          "xi-api-key": process.env.XI_API_KEY
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch conversations: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Recent conversations response:', data);
    
    // Find the most recent conversation
    if (data.conversations && data.conversations.length > 0) {
      const mostRecent = data.conversations[0]; // Assuming they're sorted by date
      console.log('Most recent conversation:', mostRecent);
      
      res.json({
        conversationId: mostRecent.conversation_id,
        agentId: mostRecent.agent_id,
        status: mostRecent.status,
        created: mostRecent.start_time_unix_secs
      });
    } else {
      res.status(404).json({ error: "No recent conversations found" });
    }
  } catch (error) {
    console.error("Error fetching recent conversation:", error);
    res.status(500).json({ error: "Failed to fetch recent conversation: " + error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}: http://localhost:${PORT}`);
});
