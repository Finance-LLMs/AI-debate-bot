// --- src/app.js ---
import { Conversation } from '@elevenlabs/client';

let conversation = null;
let mouthAnimationInterval = null;
let currentMouthState = 'M130,170 Q150,175 170,170'; // closed mouth

// Added for agent transfer functionality
let currentAgentIndex = 1; // Start with Nelson Mandela (index 1)
const agentRotation = ['michelle', 'nelson', 'taylor']; // Agent rotation order
let currentConversationId = null;
let previousConversationSaved = false;

// Create the animated doctor avatar SVG
function createAvatarSVG() {
    return `
        <svg viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg" class="avatar-svg doctor-avatar">
            <!-- Body/torso - T-shirt under coat -->
            <path d="M110,220 Q150,200 190,220 L190,350 L110,350 Z" fill="#3B82F6" />
            
            <!-- Doctor's white coat -->
            <path d="M100,220 Q150,195 200,220 L200,360 L100,360 Z" fill="white" stroke="#E5E7EB" />
            <path d="M100,220 L200,220" stroke="#E5E7EB" stroke-width="1" />
            
            <!-- Coat lapels -->
            <path d="M135,220 L130,260 L150,230 L170,260 L165,220" fill="#F9FAFB" />
            
            <!-- Coat buttons -->
            <circle cx="150" cy="270" r="3" fill="#D1D5DB" />
            <circle cx="150" cy="300" r="3" fill="#D1D5DB" />
            <circle cx="150" cy="330" r="3" fill="#D1D5DB" />
            
            <!-- Coat pockets -->
            <path d="M115,290 L135,290 L135,320 L115,320 Z" stroke="#E5E7EB" />
            <path d="M165,290 L185,290 L185,320 L165,320 Z" stroke="#E5E7EB" />
            
            <!-- Arms -->
            <path d="M110,220 Q90,240 85,280 Q84,300 90,320" stroke="#E8C4A2" stroke-width="16" stroke-linecap="round" />
            <path d="M190,220 Q210,240 215,280 Q216,300 210,320" stroke="#E8C4A2" stroke-width="16" stroke-linecap="round" />
            
            <!-- White coat sleeves -->
            <path d="M110,220 Q90,240 85,280 Q84,300 90,320" stroke="white" stroke-width="20" stroke-linecap="round" opacity="0.9" />
            <path d="M190,220 Q210,240 215,280 Q216,300 210,320" stroke="white" stroke-width="20" stroke-linecap="round" opacity="0.9" />
            
            <!-- Hands -->
            <ellipse cx="90" cy="320" rx="10" ry="12" fill="#E8C4A2" />
            <ellipse cx="210" cy="320" rx="10" ry="12" fill="#E8C4A2" />
            
            <!-- Neck -->
            <path d="M135,190 Q150,195 165,190 L165,220 L135,220 Z" fill="#E8C4A2" />
            
            <!-- Head shape -->
            <ellipse cx="150" cy="140" rx="55" ry="65" fill="#E8C4A2" />
            
            <!-- Eyebrows -->
            <path d="M115,115 Q130,110 140,115" stroke="#3F2305" stroke-width="2.5" fill="none" />
            <path d="M160,115 Q170,110 185,115" stroke="#3F2305" stroke-width="2.5" fill="none" />
            
            <!-- Eyes -->
            <path d="M115,130 Q125,125 135,130 Q125,135 115,130 Z" fill="white" />
            <path d="M165,130 Q175,125 185,130 Q175,135 165,130 Z" fill="white" />
            
            <!-- Pupils -->
            <circle cx="125" cy="130" r="3.5" fill="#594A3C" />
            <circle cx="175" cy="130" r="3.5" fill="#594A3C" />
            
            <!-- Eye highlights -->
            <circle cx="123" cy="128" r="1" fill="white" />
            <circle cx="173" cy="128" r="1" fill="white" />
            
            <!-- Lower eyelids -->
            <path d="M118,133 Q125,135 132,133" stroke="#E5A282" stroke-width="1" opacity="0.5" />
            <path d="M168,133 Q175,135 182,133" stroke="#E5A282" stroke-width="1" opacity="0.5" />
            
            <!-- Mouth -->
            <path 
                id="avatarMouth"
                d="${currentMouthState}"
                stroke="#C27D7D" 
                stroke-width="1.5" 
                fill="none"
            />
            
            <!-- Cheek shading -->
            <path d="M120,150 Q130,160 120,165" stroke="#D4B08C" stroke-width="3" opacity="0.2" />
            <path d="M180,150 Q170,160 180,165" stroke="#D4B08C" stroke-width="3" opacity="0.2" />
            
            <!-- Square glasses -->
            <path d="M105,130 L135,130 L135,145 L105,145 Z" fill="none" stroke="#31363F" stroke-width="2" />
            <path d="M165,130 L195,130 L195,145 L165,145 Z" fill="none" stroke="#31363F" stroke-width="2" />
            <path d="M135,137 L165,137" stroke="#31363F" stroke-width="2" />
            <path d="M105,130 L95,125" stroke="#31363F" stroke-width="2" />
            <path d="M195,130 L205,125" stroke="#31363F" stroke-width="2" />
            
            <!-- Ears -->
            <path d="M90,135 Q85,145 90,155 Q100,160 105,155 L102,135 Z" fill="#E8C4A2" />
            <path d="M95,140 Q93,145 95,150" stroke="#D4B08C" stroke-width="1" opacity="0.6" />
            <path d="M210,135 Q215,145 210,155 Q200,160 195,155 L198,135 Z" fill="#E8C4A2" />
            <path d="M205,140 Q207,145 205,150" stroke="#D4B08C" stroke-width="1" opacity="0.6" />
        </svg>
    `;
}

// Create celebrity avatar with image
function createCelebrityAvatar(opponent) {
    const imageMap = {
        'michelle': 'michelle.jpg',
        'nelson': 'nelson.jpg', 
        'taylor': 'taylor.jpg',
        'singapore_uncle': 'singapore_uncle.jpg'
    };
    
    const imageSrc = imageMap[opponent];
    if (!imageSrc) return createAvatarSVG(); // fallback to doctor avatar
    
    return `
        <div class="celebrity-avatar-container">
            <img 
                src="/static/images/${imageSrc}" 
                alt="${opponent} avatar" 
                class="celebrity-image"
                onerror="this.style.display='none'; this.nextSibling.style.display='block';"
            />
            <div class="fallback-avatar" style="display: none;">
                ${createAvatarSVG()}
            </div>
            <div class="speaking-indicator" id="speakingIndicator">
                <div class="speaking-wave"></div>
                <div class="speaking-wave"></div>
                <div class="speaking-wave"></div>
            </div>
        </div>
    `;
}

// Initialize avatar
function initializeAvatar() {
    const avatarWrapper = document.getElementById('animatedAvatar');
    const opponentSelect = document.getElementById('opponent');
    
    if (avatarWrapper) {
        const selectedOpponent = opponentSelect ? opponentSelect.value : '';
        
        if (selectedOpponent) {
            avatarWrapper.innerHTML = createCelebrityAvatar(selectedOpponent);
        } else {
            avatarWrapper.innerHTML = createAvatarSVG();
        }
    }
}

// Animate mouth when speaking
function startMouthAnimation() {
    if (mouthAnimationInterval) return; // Already animating
    
    const avatarWrapper = document.getElementById('animatedAvatar');
    if (avatarWrapper) {
        avatarWrapper.classList.add('avatar-speaking');
        
        // If it's a celebrity avatar, show the speaking indicator
        const speakingIndicator = document.getElementById('speakingIndicator');
        if (speakingIndicator) {
            speakingIndicator.style.display = 'flex';
        }
    }
    
    mouthAnimationInterval = setInterval(() => {
        const mouthElement = document.getElementById('avatarMouth');
        if (mouthElement) {
            // Random probability to change mouth state - creates natural speaking pattern
            const shouldChangeMouth = Math.random() > 0.4; // 60% chance to change
            
            if (shouldChangeMouth) {
                currentMouthState = currentMouthState === 'M130,170 Q150,175 170,170' 
                    ? 'M130,170 Q150,195 170,170' // open mouth (oval)
                    : 'M130,170 Q150,175 170,170'; // closed mouth
                
                mouthElement.setAttribute('d', currentMouthState);
                mouthElement.setAttribute('fill', currentMouthState.includes('195') ? '#8B4513' : 'none');
                mouthElement.setAttribute('opacity', currentMouthState.includes('195') ? '0.7' : '1');
            }
        }
    }, Math.random() * 200 + 100); // Variable timing 100-300ms
}

// Stop mouth animation
function stopMouthAnimation() {
    if (mouthAnimationInterval) {
        clearInterval(mouthAnimationInterval);
        mouthAnimationInterval = null;
    }
    
    const avatarWrapper = document.getElementById('animatedAvatar');
    if (avatarWrapper) {
        avatarWrapper.classList.remove('avatar-speaking');
        
        // Hide speaking indicator for celebrity avatars
        const speakingIndicator = document.getElementById('speakingIndicator');
        if (speakingIndicator) {
            speakingIndicator.style.display = 'none';
        }
    }
    
    // Reset mouth to closed state
    currentMouthState = 'M130,170 Q150,175 170,170';
    const mouthElement = document.getElementById('avatarMouth');
    if (mouthElement) {
        mouthElement.setAttribute('d', currentMouthState);
        mouthElement.setAttribute('fill', 'none');
        mouthElement.setAttribute('opacity', '1');
    }
}

async function requestMicrophonePermission() {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        return true;
    } catch (error) {
        console.error('Microphone permission denied:', error);
        return false;
    }
}

async function getSignedUrl(opponent) {
    try {
        const url = opponent ? `/api/signed-url?opponent=${opponent}` : '/api/signed-url';
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to get signed URL');
        const data = await response.json();
        return data.signedUrl;
    } catch (error) {
        console.error('Error getting signed URL:', error);
        throw error;
    }
}

async function getAgentId() {
    const response = await fetch('/api/getAgentId');
    const { agentId } = await response.json();
    return agentId;
}

function updateStatus(isConnected) {
    const statusElement = document.getElementById('connectionStatus');
    statusElement.textContent = isConnected ? 'Connected' : 'Disconnected';
    statusElement.classList.toggle('connected', isConnected);
}

function updateSpeakingStatus(mode) {
    const statusElement = document.getElementById('speakingStatus');
    const summaryButton = document.getElementById('summaryButton');
    
    // Update based on the exact mode string we receive
    const isSpeaking = mode.mode === 'speaking';
    statusElement.textContent = isSpeaking ? 'Agent Speaking' : 'Agent Silent';
    statusElement.classList.toggle('speaking', isSpeaking);
    
    // Animate avatar based on speaking state
    if (isSpeaking) {
        startMouthAnimation();
        // Disable summary button when agent is speaking
        if (summaryButton) {
            summaryButton.disabled = true;
        }
    } else {
        stopMouthAnimation();
        
        // Only enable summary button when:
        // 1. Agent is done speaking
        // 2. Button should be visible
        // 3. We're not in the middle of a summary request
        if (summaryButton && summaryButton.style.display !== 'none' && !summarizeRequested) {
            summaryButton.disabled = false;
        }
        
        // If the agent just finished speaking and we requested a summary,
        // this is likely the end of the summary response
        if (summarizeRequested) {
            console.log('Agent finished speaking after summary request');
            // Reset the summary request state after a brief delay
            // to ensure any follow-up API calls have completed
            setTimeout(() => {
                summarizeRequested = false;
                
                // Reset the button if it still exists and should be visible
                if (summaryButton && summaryButton.style.display !== 'none') {
                    // Reset button appearance
                    summaryButton.disabled = false;
                    summaryButton.classList.remove('loading');
                    
                    // Reset button text
                    summaryButton.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="8" y1="6" x2="21" y2="6"></line>
                            <line x1="8" y1="12" x2="21" y2="12"></line>
                            <line x1="8" y1="18" x2="21" y2="18"></line>
                            <line x1="3" y1="6" x2="3.01" y2="6"></line>
                            <line x1="3" y1="12" x2="3.01" y2="12"></line>
                            <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                        Summarize Debate
                    `;
                    console.log('Summary completed, button reset and re-enabled');
                }
            }, 1000); // Wait 1 second before resetting to ensure API operations completed
        }
    }
    
    console.log('Speaking status updated:', { mode, isSpeaking, summarizeRequested }); // Debug log
}

// Function to disable/enable form controls
function setFormControlsState(disabled) {
    const topicSelect = document.getElementById('topic');
    const opponentSelect = document.getElementById('opponent');
    
    topicSelect.disabled = disabled;
    opponentSelect.disabled = disabled;
    // Removed stanceSelect reference since it no longer exists
}

async function startConversation() {
    const startButton = document.getElementById('startButton');
    const endButton = document.getElementById('endButton');
    const summaryButton = document.getElementById('summaryButton');
    const transferButton = document.getElementById('transferButton');
    
    try {
        // Disable start button immediately to prevent multiple clicks
        startButton.disabled = true;
        
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
            alert('Microphone permission is required for the conversation.');
            startButton.disabled = false;
            return;
        }
        
        // Get selected opponent or use the current agent in rotation
        let selectedOpponent = document.getElementById('opponent').value;
        
        // If we're using agent rotation, override the selected opponent
        if (previousConversationSaved) {
            selectedOpponent = agentRotation[currentAgentIndex];
            
            // Update the dropdown to match the current agent in rotation
            const opponentSelect = document.getElementById('opponent');
            opponentSelect.value = selectedOpponent;
        }
        
        const signedUrl = await getSignedUrl(selectedOpponent);
        //const agentId = await getAgentId(); // You can switch to agentID for public agents
        
        // Set user stance to "for" and AI stance to "against" by default
        const userStance = "for";
        const aiStance = "against";
        
        // Get the actual topic text instead of the value
        const topicSelect = document.getElementById('topic');
        const topicText = topicSelect.options[topicSelect.selectedIndex].text;
        
        // Get previous conversation history if we're transferring between agents
        let previousConversation = '';
        if (previousConversationSaved) {
            previousConversation = await getSavedConversationHistory();
            console.log('Retrieved previous conversation history:', previousConversation ? 'Yes' : 'No');
        }
        
        // Build dynamic variables object
        const dynamicVars = {
            topic: topicText,
            user_stance: userStance,
            ai_stance: aiStance
        };
        
        // Add previous conversation context if available
        if (previousConversation) {
            dynamicVars.previous_conversation = previousConversation;
        }
        
        conversation = await Conversation.startSession({
            signedUrl: signedUrl,
            //agentId: agentId, // You can switch to agentID for public agents
            dynamicVariables: dynamicVars,
            onConnect: () => {
                console.log('Connected');
                updateStatus(true);
                setFormControlsState(true); // Disable form controls
                startButton.style.display = 'none';
                endButton.disabled = false;
                endButton.style.display = 'flex';
                summaryButton.disabled = false;
                summaryButton.style.display = 'flex';
                transferButton.disabled = false;
                transferButton.style.display = 'flex';
                
                // Try to find conversation ID using our helper function
                console.log('New conversation created, searching for conversation ID...');
                
                const foundId = inspectConversationForId(conversation);
                if (foundId) {
                    currentConversationId = foundId;
                    console.log('Successfully found conversation ID:', currentConversationId);
                } else {
                    console.warn('Could not find conversation ID from conversation object');
                    
                    // Create a temporary ID if we can't find one
                    currentConversationId = 'temp-' + Date.now();
                    console.log('Created temporary conversation ID:', currentConversationId);
                }
                
                // Set up a delayed check for when the ID might become available
                setTimeout(() => {
                    console.log('Running delayed ID check...');
                    const delayedId = inspectConversationForId(conversation);
                    if (delayedId && delayedId !== currentConversationId) {
                        console.log('Found new ID in delayed check:', delayedId);
                        currentConversationId = delayedId;
                    }
                }, 3000); // Check after 3 seconds
                
                // Also send the conversation object to our debug endpoint
                try {
                    fetch('/api/debug-conversation', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            data: conversation
                        })
                    });
                } catch (debugError) {
                    console.warn('Error sending to debug endpoint (non-critical):', debugError);
                }
                
                // Check immediately if we can access the conversation ID
                currentConversationId = inspectConversationForId(conversation) || currentConversationId;
            },            
            onDisconnect: () => {
                console.log('Disconnected');
                updateStatus(false);
                setFormControlsState(false); // Re-enable form controls
                startButton.disabled = false;
                startButton.style.display = 'flex';
                endButton.disabled = true;
                endButton.style.display = 'none';
                summaryButton.disabled = true;
                summaryButton.style.display = 'none';
                transferButton.disabled = true;
                transferButton.style.display = 'none';
                updateSpeakingStatus({ mode: 'listening' }); // Reset to listening mode on disconnect
                stopMouthAnimation(); // Ensure avatar animation stops
            },
            onError: (error) => {
                console.error('Conversation error:', error);
                setFormControlsState(false); // Re-enable form controls on error
                startButton.disabled = false;
                startButton.style.display = 'flex';
                endButton.disabled = true;
                endButton.style.display = 'none';
                summaryButton.disabled = true;
                summaryButton.style.display = 'none';
                transferButton.disabled = true;
                transferButton.style.display = 'none';
                alert('An error occurred during the conversation.');
            },
            onModeChange: (mode) => {
                console.log('Mode changed:', mode); // Debug log to see exact mode object
                updateSpeakingStatus(mode);
            }
        });
    } catch (error) {
        console.error('Error starting conversation:', error);
        setFormControlsState(false); // Re-enable form controls on error
        startButton.disabled = false;
        alert('Failed to start conversation. Please try again.');
    }
}

async function endConversation() {
    if (conversation) {
        await conversation.endSession();
        conversation = null;
    }
}

// Track if the summary button was clicked to request a summary
let summarizeRequested = false;

// Function to request a summary of the conversation
async function summarizeConversation() {
    if (conversation && !summarizeRequested) {
        try {
            // Set flag to indicate we're expecting a summary
            summarizeRequested = true;
            
            // Disable the summary button and add loading indicator
            const summaryButton = document.getElementById('summaryButton');
            if (summaryButton) {
                summaryButton.disabled = true;
                summaryButton.classList.add('loading');
                
                // Change button text to indicate processing
                const originalText = summaryButton.innerHTML;
                summaryButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                    Creating Summary...
                `;
            }
            
            // Log the request time for debugging
            console.log(`Summary requested at ${new Date().toISOString()}`);
            
            // Send a message to the AI asking for a summary
            // Try different methods in case the API has changed
            try {
                // Prepare the summary message with clear instructions
                const summaryPrompt = "Please summarize our entire debate so far with key points from both sides.";
                
                // Method 1: Using sendTextMessage (original method)
                if (typeof conversation.sendTextMessage === 'function') {
                    await conversation.sendTextMessage(summaryPrompt);
                    console.log('Summary requested using sendTextMessage');
                } 
                // Method 2: Using sendUserMessage 
                else if (typeof conversation.sendUserMessage === 'function') {
                    await conversation.sendUserMessage(summaryPrompt);
                    console.log('Summary requested using sendUserMessage');
                }
                // Method 3: Using prompt
                else if (typeof conversation.prompt === 'function') {
                    await conversation.prompt(summaryPrompt);
                    console.log('Summary requested using prompt');
                }                
                // Method 4: Using write
                else if (typeof conversation.write === 'function') {
                    await conversation.write(summaryPrompt);
                    console.log('Summary requested using write');
                }
                // Method 5: Using ask
                else if (typeof conversation.ask === 'function') {
                    await conversation.ask(summaryPrompt);
                    console.log('Summary requested using ask');
                }
                // Method 6: If none of the above works, log the available methods and information
                else {
                    console.error('No suitable message sending method found on conversation object');
                    console.log('Available methods:', 
                        Object.getOwnPropertyNames(Object.getPrototypeOf(conversation)));
                    console.log('Conversation object keys:', Object.keys(conversation));
                    console.log('Conversation object:', conversation);
                    throw new Error('No suitable method to send message to AI');
                }
            } catch (innerError) {
                console.error('Error sending message:', innerError);
                throw innerError;
            }
            
            console.log('Summary requested, button will remain disabled until summary is complete');
            
            // Safety fallback: If after 60 seconds the flag is still set (agent didn't complete speaking),
            // reset the flag and re-enable the button
            setTimeout(() => {
                if (summarizeRequested) {
                    console.log(`Fallback: Summary request timed out after 60 seconds at ${new Date().toISOString()}`);
                    summarizeRequested = false;
                    
                    // Reset the button if it's still on the page and disabled
                    const summaryButtonCheck = document.getElementById('summaryButton');
                    if (summaryButtonCheck) {
                        if (summaryButtonCheck.disabled && summaryButtonCheck.style.display !== 'none') {
                            // Reset button to original state
                            summaryButtonCheck.disabled = false;
                            summaryButtonCheck.classList.remove('loading');
                            summaryButtonCheck.innerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="8" y1="6" x2="21" y2="6"></line>
                                    <line x1="8" y1="12" x2="21" y2="12"></line>
                                    <line x1="8" y1="18" x2="21" y2="18"></line>
                                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                </svg>
                                Summarize Debate
                            `;
                            console.log('Summary button reset by timeout fallback');
                        }
                    }
                }
            }, 60000);
        } catch (error) {
            console.error('Error requesting summary:', error);
            alert('Failed to request summary. Please try again.');
            
            // Re-enable the button on error after a short delay
            setTimeout(() => {
                const summaryButton = document.getElementById('summaryButton');
                if (summaryButton) {
                    summaryButton.disabled = false;
                }
            }, 1000);
        }
    }
}

async function getConversationHistory(conversationId) {
    try {
        console.log(`Fetching conversation history for ID: ${conversationId}`);
        
        if (!conversationId) {
            throw new Error('No conversation ID provided to getConversationHistory');
        }
        
        const response = await fetch(`/api/conversation-history/${conversationId}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API error (${response.status}): ${errorText}`);
            throw new Error(`Failed to get conversation history: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Successfully retrieved conversation history:', data);
        return data;
    } catch (error) {
        console.error('Error in getConversationHistory function:', error);
        throw error;
    }
}

async function saveConversation(conversationId, currentAgent) {
    try {
        console.log(`Saving conversation. ID: ${conversationId}, Agent: ${currentAgent}`);
        
        if (!conversationId) {
            throw new Error('No conversation ID provided to saveConversation');
        }
        
        // Get conversation history from ElevenLabs API
        let history;
        try {
            history = await getConversationHistory(conversationId);
            console.log('Retrieved conversation history:', history);
        } catch (historyError) {
            console.error('Error getting conversation history:', historyError);
            
            // If we can't get the conversation history from the API,
            // create a fallback history from the conversation object
            if (conversation) {
                console.log('Using fallback to create conversation history');
                history = {
                    messages: [{
                        role: 'system',
                        content: `This is a fallback conversation history. The conversation with ${currentAgent} could not be retrieved from the API.`
                    }]
                };
                
                // If there are any dynamic variables, include them
                if (conversation.dynamicVariables) {
                    history.dynamicVariables = conversation.dynamicVariables;
                }
            } else {
                throw new Error('No conversation data available for fallback');
            }
        }
        
        // Save to backend
        const response = await fetch('/api/save-conversation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversation: history,
                currentAgent: currentAgent
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to save conversation: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Conversation saved successfully:', result);
        return result;
    } catch (error) {
        console.error('Error in saveConversation function:', error);
        throw error;
    }
}

async function getSavedConversationHistory() {
    try {
        const response = await fetch('/api/get-saved-conversation');
        if (!response.ok) throw new Error('Failed to get saved conversation history');
        const data = await response.json();
        return data.conversationHistory || '';
    } catch (error) {
        console.error('Error fetching saved conversation history:', error);
        return '';
    }
}

// Transfer to the next agent in the rotation
async function transferAgent() {
    if (!conversation) {
        console.error('No active conversation to transfer');
        alert('No active conversation to transfer. Please start a conversation first.');
        return;
    }
    
    try {
        const transferButton = document.getElementById('transferButton');
        transferButton.disabled = true;
        transferButton.classList.add('loading');
        transferButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 1l4 4-4 4"/>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                <path d="M7 23l-4-4 4-4"/>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
            Transferring...
        `;
        
        // Try to debug the conversation object
        try {
            await fetch('/api/debug-conversation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: conversation
                })
            });
        } catch (debugError) {
            console.warn('Debug endpoint error (non-critical):', debugError);
        }
        
        // Get the current conversation ID
        console.log('Conversation object type:', typeof conversation);
        console.log('Conversation object keys:', Object.keys(conversation));
        
        // Try various methods to extract the conversation ID
        let extractedId = null;
        
        // Method 1: Direct property access
        if (conversation.conversationId) {
            extractedId = conversation.conversationId;
            console.log('Method 1: Found ID in conversation.conversationId:', extractedId);
        } 
        // Method 2: ID property
        else if (conversation.id) {
            extractedId = conversation.id;
            console.log('Method 2: Found ID in conversation.id:', extractedId);
        }
        // Method 3: Private properties
        else if (conversation._conversationId) {
            extractedId = conversation._conversationId;
            console.log('Method 3: Found ID in conversation._conversationId:', extractedId);
        }
        else if (conversation._id) {
            extractedId = conversation._id;
            console.log('Method 4: Found ID in conversation._id:', extractedId);
        }
        // Method 5: Function calls
        else if (typeof conversation.getConversationId === 'function') {
            try {
                extractedId = conversation.getConversationId();
                console.log('Method 5: Retrieved ID using getConversationId():', extractedId);
            } catch (e) {
                console.warn('Error calling getConversationId():', e);
            }
        }
        // Method 6: Look for an ID in a socket or connection property
        else if (conversation.socket && conversation.socket.id) {
            extractedId = conversation.socket.id;
            console.log('Method 6: Found ID in conversation.socket.id:', extractedId);
        }
        else if (conversation.connection && conversation.connection.id) {
            extractedId = conversation.connection.id;
            console.log('Method 7: Found ID in conversation.connection.id:', extractedId);
        }
        
        // Use the conversation ID from the current conversation or the one we previously stored
        currentConversationId = extractedId || currentConversationId;
        
        if (!currentConversationId) {
            console.error('Could not determine conversation ID from any available method');
            console.log('Creating fallback ID');
            currentConversationId = 'fallback-' + Date.now();
        }
        
        console.log('Using conversation ID:', currentConversationId);
        
        // Save current conversation to file, even with fallback ID
        const currentAgent = agentRotation[currentAgentIndex];
        await saveConversation(currentConversationId, currentAgent);
        previousConversationSaved = true;
        
        // End the current conversation
        try {
            console.log('Ending current conversation session...');
            await conversation.endSession();
            console.log('Successfully ended conversation session');
        } catch (endError) {
            console.warn('Error ending conversation session (continuing anyway):', endError);
        }
        
        conversation = null;
        
        // Move to the next agent in the rotation
        currentAgentIndex = (currentAgentIndex + 1) % agentRotation.length;
        const newAgent = agentRotation[currentAgentIndex];
        console.log(`Rotating to next agent: ${newAgent} (index ${currentAgentIndex})`);
        
        // Update the opponent dropdown to reflect the new agent
        const opponentSelect = document.getElementById('opponent');
        opponentSelect.value = newAgent;
        
        // Update avatar
        initializeAvatar();
        
        // Start new conversation with the next agent
        console.log('Starting new conversation with agent:', newAgent);
        await startConversation();
        
        console.log('Agent transfer completed successfully');
        
    } catch (error) {
        console.error('Error during agent transfer:', error);
        
        // Ask the user if they want to force transfer
        const confirmForce = confirm(`Failed to transfer agent: ${error.message}\n\nWould you like to force a transfer? This will continue with the next agent but might lose some conversation context.`);
        
        if (confirmForce) {
            console.log('User confirmed force transfer');
            const success = await forceTransfer();
            
            if (success) {
                console.log('Force transfer successful');
                return; // Exit early if successful
            } else {
                console.error('Force transfer also failed');
                alert('Force transfer also failed. Please try again later.');
            }
        } else {
            console.log('User declined force transfer');
        }
        
        // Reset the button state
        const transferButton = document.getElementById('transferButton');
        transferButton.disabled = false;
        transferButton.classList.remove('loading');
        transferButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 1l4 4-4 4"/>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                <path d="M7 23l-4-4 4-4"/>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
            Transfer Agent
        `;
    }
}

// Force transfer when regular transfer fails
async function forceTransfer() {
    try {
        console.log('Attempting forced agent transfer');
        
        // End current conversation if it exists
        if (conversation) {
            try {
                await conversation.endSession();
            } catch (endError) {
                console.warn('Error ending existing conversation (continuing anyway):', endError);
            }
            conversation = null;
        }
        
        // Set flag indicating we have context to pass
        previousConversationSaved = true;
        
        // Move to the next agent in the rotation
        currentAgentIndex = (currentAgentIndex + 1) % agentRotation.length;
        const newAgent = agentRotation[currentAgentIndex];
        console.log(`Force rotating to agent: ${newAgent} (index ${currentAgentIndex})`);
        
        // Update the opponent dropdown and avatar
        const opponentSelect = document.getElementById('opponent');
        opponentSelect.value = newAgent;
        initializeAvatar();
        
        // Start new conversation
        await startConversation();
        
        return true;
    } catch (error) {
        console.error('Error in force transfer:', error);
        return false;
    }
}

// Function to inspect the conversation object and try to find the conversation ID
function inspectConversationForId(conv) {
    if (!conv) {
        console.error('No conversation object provided to inspectConversationForId');
        return null;
    }
    
    console.log('Inspecting conversation object:', conv);
    console.log('Conversation type:', typeof conv);
    
    // Stringify to catch non-enumerable properties
    try {
        const stringifiedConv = JSON.stringify(conv, Object.getOwnPropertyNames(conv));
        console.log('Stringified conversation:', stringifiedConv);
    } catch (e) {
        console.warn('Could not stringify full conversation object:', e);
    }
    
    // Check if any property contains 'id' in its name at any level
    function findIdProperty(obj, path = '') {
        if (!obj || typeof obj !== 'object') return;
        
        Object.keys(obj).forEach(key => {
            const currentPath = path ? `${path}.${key}` : key;
            
            if (key.toLowerCase().includes('id') && typeof obj[key] === 'string') {
                console.log(`Potential ID found at ${currentPath}:`, obj[key]);
            }
            
            if (obj[key] && typeof obj[key] === 'object') {
                findIdProperty(obj[key], currentPath);
            }
        });
    }
    
    findIdProperty(conv);
    
    // Try known properties where ID might be stored
    const idCandidates = [
        'conversationId', 'id', '_conversationId', '_id',
        'conversation_id', 'convId', 'sessionId', 'session_id'
    ];
    
    for (const candidate of idCandidates) {
        if (conv[candidate]) {
            console.log(`Found ID in ${candidate}:`, conv[candidate]);
            return conv[candidate];
        }
    }
    
    // If we have a toString or valueOf method, try those
    if (typeof conv.toString === 'function' && conv.toString() !== '[object Object]') {
        console.log('toString() result:', conv.toString());
    }
    
    if (typeof conv.valueOf === 'function' && typeof conv.valueOf() !== 'object') {
        console.log('valueOf() result:', conv.valueOf());
    }
    
    return null;
}

// Event listeners for buttons
document.getElementById('startButton').addEventListener('click', startConversation);
document.getElementById('endButton').addEventListener('click', endConversation);
document.getElementById('summaryButton').addEventListener('click', summarizeConversation);
document.getElementById('transferButton').addEventListener('click', transferAgent);

// Initialize avatar when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeAvatar();
    
    // Enable start button when topic and opponent are selected
    const topicSelect = document.getElementById('topic');
    const opponentSelect = document.getElementById('opponent');
    const startButton = document.getElementById('startButton');
    const endButton = document.getElementById('endButton');
    const summaryButton = document.getElementById('summaryButton');
    const transferButton = document.getElementById('transferButton');
    
    // Ensure initial button states
    endButton.style.display = 'none';
    summaryButton.style.display = 'none';
    transferButton.style.display = 'none';
    
    // Set initial agent
    opponentSelect.value = agentRotation[currentAgentIndex]; // Start with Nelson Mandela
    
    function checkFormValidity() {
        const topicSelected = topicSelect.value !== '';
        const opponentSelected = opponentSelect.value !== '';
        startButton.disabled = !(topicSelected && opponentSelected);
    }
    
    // Add event listeners for all form controls
    topicSelect.addEventListener('change', checkFormValidity);
    opponentSelect.addEventListener('change', () => {
        checkFormValidity();
        initializeAvatar(); // Update avatar when opponent changes
    });
    
    // Initial check
    checkFormValidity();
});

window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});