const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/static", express.static(path.join(__dirname, "../dist")));

// Track turn-taking state
let currentSpeaker = null;
let humanTurnCount = 0;
let currentConversationId = null;

app.get("/api/signed-url", async (req, res) => {
  try {
    const { opponent } = req.query;
    let agentId = process.env.AGENT_ID; // Default agent ID
      
    // Map opponent to specific agent ID
    if (opponent === 'michelle') {
      agentId = process.env.MICHELLE_AGENT_ID;
    } else if (opponent === 'nelson') {
      agentId = process.env.NELSON_AGENT_ID;
    } else if (opponent === 'taylor') {
      agentId = process.env.TAYLOR_AGENT_ID;
    } else if (opponent === 'singapore_uncle') {
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
    res.json({ signedUrl: data.signed_url });
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
    console.log("Turn tracking reset");
    res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("Reset turns error:", error);
    res.status(500).json({ error: "Reset turns failed" });
  }
});

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}: http://localhost:${PORT}`);
});
