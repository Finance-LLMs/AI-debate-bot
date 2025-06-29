const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/static", express.static(path.join(__dirname, "../dist")));

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

// New API endpoint to fetch conversation history
app.get("/api/conversation-history/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID is required" });
    }
    
    console.log(`Fetching conversation history for ID: ${conversationId}`);
    // Try first with singular "conversation" endpoint
    let response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/${conversationId}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": process.env.XI_API_KEY,
        },
      }
    );
    
    // If that fails, try with plural "conversations" endpoint
    if (!response.ok) {
      console.log(`First endpoint attempt failed with status ${response.status}. Trying alternative endpoint...`);
      
      response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
        {
          method: "GET",
          headers: {
            "xi-api-key": process.env.XI_API_KEY,
          },
        }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      throw new Error(`Failed to get conversation history: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching conversation history:", error);
    res.status(500).json({ error: "Failed to get conversation history" });
  }
});

// New API endpoint to save conversation history to a file
app.post("/api/save-conversation", async (req, res) => {
  try {
    const { conversation, currentAgent } = req.body;
    
    if (!conversation) {
      return res.status(400).json({ error: "Conversation data is required" });
    }
    
    // Create a formatted conversation text
    const formattedConversation = formatConversationForStorage(conversation, currentAgent);
    
    // Path to the conversation history file
    const filePath = path.join(__dirname, "../conversation_history.txt");
    
    // Append to file or create if it doesn't exist
    fs.appendFileSync(filePath, formattedConversation);
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving conversation:", error);
    res.status(500).json({ error: "Failed to save conversation history" });
  }
});

// Helper function to format conversation for storage
function formatConversationForStorage(conversation, currentAgent) {
  console.log(`Formatting conversation for ${currentAgent}:`, conversation);
  
  const timestamp = new Date().toISOString();
  let formattedText = `\n\n--- ${currentAgent} CONVERSATION AT ${timestamp} ---\n\n`;
  
  try {
    if (conversation.messages && Array.isArray(conversation.messages)) {
      console.log(`Processing ${conversation.messages.length} messages from conversation.messages`);
      conversation.messages.forEach(msg => {
        if (msg && typeof msg.content === 'string') {
          const role = msg.role === 'user' ? 'USER' : currentAgent;
          formattedText += `${role}: ${msg.content}\n`;
        } else {
          console.warn('Skipping invalid message:', msg);
        }
      });
    } else if (Array.isArray(conversation)) {
      console.log(`Processing ${conversation.length} messages from array conversation`);
      conversation.forEach(msg => {
        if (msg && typeof msg.content === 'string') {
          const role = msg.role === 'user' ? 'USER' : currentAgent;
          formattedText += `${role}: ${msg.content}\n`;
        } else {
          console.warn('Skipping invalid message:', msg);
        }
      });
    } else if (conversation.history && Array.isArray(conversation.history)) {
      console.log(`Processing ${conversation.history.length} messages from conversation.history`);
      conversation.history.forEach(msg => {
        if (msg && typeof msg.content === 'string') {
          const role = msg.role === 'user' ? 'USER' : currentAgent;
          formattedText += `${role}: ${msg.content}\n`;
        } else {
          console.warn('Skipping invalid message:', msg);
        }
      });
    } else {
      console.warn('No valid messages found in conversation. Adding fallback message.');
      formattedText += `SYSTEM: No conversation history was available for ${currentAgent}.\n`;
    }
  } catch (error) {
    console.error('Error formatting conversation:', error);
    formattedText += `SYSTEM: Error formatting conversation: ${error.message}\n`;
  }
  
  return formattedText;
}

// New API endpoint to get the stored conversation history
app.get("/api/get-saved-conversation", (req, res) => {
  try {
    const filePath = path.join(__dirname, "../conversation_history.txt");
    
    if (!fs.existsSync(filePath)) {
      return res.json({ conversationHistory: "" });
    }
    
    const conversationHistory = fs.readFileSync(filePath, "utf-8");
    res.json({ conversationHistory });
  } catch (error) {
    console.error("Error reading conversation history:", error);
    res.status(500).json({ error: "Failed to read conversation history" });
  }
});

// Debug endpoint to directly inspect conversation objects
app.post("/api/debug-conversation", (req, res) => {
  try {
    const { data } = req.body;
    
    console.log('Debug conversation data received:', JSON.stringify(data, null, 2));
    
    // Log important properties
    if (data && typeof data === 'object') {
      console.log('Top-level keys:', Object.keys(data));
      
      // Check for conversation ID
      const possibleIdKeys = ['id', 'conversationId', '_id', '_conversationId'];
      possibleIdKeys.forEach(key => {
        if (data[key]) {
          console.log(`Found conversation ID in ${key}:`, data[key]);
        }
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    res.status(500).json({ error: error.message });
  }
});

// Serve index.html for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}: http://localhost:${PORT}`);
});
