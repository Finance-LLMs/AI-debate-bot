const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

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

// Serve index.html for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// Webhook endpoint for agent-to-agent conversation passing
app.post("/webhook", express.json(), async (req, res) => {
  try {
    console.log("Webhook received:", req.body);
    
    // 1. Get conversation_id from webhook payload
    const { conversation_id, agent_id } = req.body;
    
    // 2. Get current agent details from the conversation
    const currentAgentId = agent_id;
    
    // 3. Determine next agent in the sequence
    const agentSequence = {
      [process.env.NELSON_AGENT_ID]: process.env.MICHELLE_AGENT_ID,
      [process.env.MICHELLE_AGENT_ID]: process.env.TAYLOR_AGENT_ID,
      [process.env.TAYLOR_AGENT_ID]: process.env.SINGAPORE_UNCLE_AGENT_ID,
      [process.env.SINGAPORE_UNCLE_AGENT_ID]: null // End of sequence
    };
    
    const nextAgentId = agentSequence[currentAgentId];
    
    if (nextAgentId) {
      // 4. Fetch full conversation history
      const conversationResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversations/${conversation_id}`,
        {
          headers: {
            "xi-api-key": process.env.XI_API_KEY
          }
        }
      );
      
      if (!conversationResponse.ok) {
        throw new Error(`Failed to fetch conversation: ${conversationResponse.status}`);
      }
      
      const conversationHistory = await conversationResponse.json();
      
      // 5. Start new conversation with next agent
      await startNextAgentConversation(nextAgentId, conversationHistory, conversation_id);
    } else {
      console.log("End of agent sequence reached");
    }
    
    res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Function to start conversation with next agent
async function startNextAgentConversation(nextAgentId, conversationHistory, originalConversationId) {
  try {
    // Extract the conversation transcript to pass context
    const messages = conversationHistory.messages || [];
    
    // Build context from previous conversation
    let conversationContext = "Previous conversation:\n";
    messages.forEach((message, index) => {
      const speaker = message.role === 'user' ? 'Human' : 'Agent';
      conversationContext += `${speaker}: ${message.content}\n`;
    });
    
    // Create a new conversation with the next agent
    const newConversationResponse = await fetch(
      "https://api.elevenlabs.io/v1/convai/conversations",
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.XI_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          agent_id: nextAgentId,
          // Pass the conversation context as initial message
          initial_message: `Continue this debate. Here's what has been discussed so far:\n\n${conversationContext}\n\nPlease provide your perspective on this topic.`
        })
      }
    );
    
    if (!newConversationResponse.ok) {
      throw new Error(`Failed to create new conversation: ${newConversationResponse.status}`);
    }
    
    const newConversation = await newConversationResponse.json();
    console.log(`Started new conversation with agent ${nextAgentId}:`, newConversation.conversation_id);
    
    // Optionally, you can store the relationship between conversations
    // Store mapping: originalConversationId -> newConversation.conversation_id
    
    return newConversation;
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
