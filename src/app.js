// --- src/app.js ---
import { Conversation } from '@elevenlabs/client';

let conversation = null;
let mouthAnimationInterval = null;
let currentMouthState = 'M130,170 Q150,175 170,170'; // closed mouth
let isConnecting = false; // Flag to prevent multiple simultaneous connections
let connectionReadyPromise = null; // Promise to track connection readiness
let keepAliveInterval = null; // Interval for WebSocket keep-alive

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
    const selectedOpponent = getSelectedOpponent();
    
    if (avatarWrapper) {
        if (selectedOpponent) {
            avatarWrapper.innerHTML = createCelebrityAvatar(selectedOpponent);
        } else {
            avatarWrapper.innerHTML = createAvatarSVG();
        }
    }
}

// Get the currently selected opponent from buttons
function getSelectedOpponent() {
    const selectedButton = document.querySelector('.opponent-button.selected');
    return selectedButton ? selectedButton.getAttribute('data-opponent') : '';
}

// Handle opponent button selection
function selectOpponent(opponentValue) {
    // Remove selection from all buttons
    document.querySelectorAll('.opponent-button').forEach(button => {
        button.classList.remove('selected');
    });
    
    // Add selection to clicked button
    const selectedButton = document.querySelector(`[data-opponent="${opponentValue}"]`);
    if (selectedButton) {
        selectedButton.classList.add('selected');
    }
    
    // Update avatar and form validity
    initializeAvatar();
    checkFormValidity();
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
        console.log('Requesting signed URL for:', opponent, 'URL:', url);
        const response = await fetch(url);
        if (!response.ok) {
            console.error('Failed to get signed URL, status:', response.status);
            throw new Error('Failed to get signed URL');
        }
        const data = await response.json();
        console.log('Received signed URL response:', data);
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
    const opponentButtons = document.querySelectorAll('.opponent-button');
    
    topicSelect.disabled = disabled;
    opponentButtons.forEach(button => button.disabled = disabled);
}

async function startConversation() {
    const startButton = document.getElementById('startButton');
    const endButton = document.getElementById('endButton');
    const summaryButton = document.getElementById('summaryButton');
    
    try {
        // Disable start button immediately to prevent multiple clicks
        startButton.disabled = true;
        
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
            alert('Microphone permission is required for the conversation.');
            startButton.disabled = false;
            return;
        }
        
        // Get selected opponent
        const selectedOpponent = getSelectedOpponent();
        
        const signedUrl = await getSignedUrl(selectedOpponent);
        //const agentId = await getAgentId(); // You can switch to agentID for public agents
        
        // Set user stance to "for" and AI stance to "against" by default
        const userStance = "for";
        const aiStance = "against";
        
        // Get the actual topic text instead of the value
        const topicSelect = document.getElementById('topic');
        const topicText = topicSelect.options[topicSelect.selectedIndex].text;
        
        // Create new conversation with proper WebSocket management
        await createNewConversation({
            signedUrl: signedUrl,
            //agentId: agentId, // You can switch to agentID for public agents
            dynamicVariables: {
                topic: topicText,
                user_stance: userStance,
                ai_stance: aiStance
            },
            onConnect: () => {
                console.log('Connected');
                updateStatus(true);
                setFormControlsState(true); // Disable form controls
                startButton.style.display = 'none';
                document.getElementById('startScriptedAI').style.display = 'none';
                endButton.disabled = false;
                endButton.style.display = 'flex';
                summaryButton.disabled = false;
                summaryButton.style.display = 'flex';
            },            
            onDisconnect: () => {
                console.log('Disconnected');
                updateStatus(false);
                setFormControlsState(false); // Re-enable form controls
                startButton.disabled = false;
                startButton.style.display = 'flex';
                document.getElementById('startScriptedAI').style.display = 'flex';
                endButton.disabled = true;
                endButton.style.display = 'none';
                summaryButton.disabled = true;
                summaryButton.style.display = 'none';
                document.getElementById('qnaButton').style.display = 'block';
                updateSpeakingStatus({ mode: 'listening' }); // Reset to listening mode on disconnect
                stopMouthAnimation(); // Ensure avatar animation stops
                stopKeepAlive(); // Stop keep-alive when disconnected
            },
            onError: (error) => {
                console.error('Conversation error:', error);
                setFormControlsState(false); // Re-enable form controls on error
                startButton.disabled = false;
                startButton.style.display = 'flex';
                document.getElementById('startScriptedAI').style.display = 'flex';
                endButton.disabled = true;
                endButton.style.display = 'none';
                summaryButton.disabled = true;
                summaryButton.style.display = 'none';
                document.getElementById('qnaButton').style.display = 'block';
                alert('An error occurred during the conversation.');
            },
            onModeChange: (mode) => {
                console.log('Mode changed:', mode); // Debug log to see exact mode object
                updateSpeakingStatus(mode);
            }
        });
        
        console.log('Regular conversation session created successfully');
        
    } catch (error) {
        console.error('Error starting conversation:', error);
        setFormControlsState(false); // Re-enable form controls on error
        startButton.disabled = false;
        alert('Failed to start conversation. Please try again.');
    }
}

// Function to start WebSocket keep-alive mechanism
function startKeepAlive() {
    // Clear any existing keep-alive
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
    }
    
    // Send a space character every 15 seconds to keep connection alive
    // (ElevenLabs closes connections after 20 seconds of inactivity)
    keepAliveInterval = setInterval(() => {
        if (conversation && safeSendMessage(conversation, " ")) {
            console.log('Keep-alive signal sent');
        }
    }, 15000); // 15 seconds
}

// Function to stop WebSocket keep-alive mechanism
function stopKeepAlive() {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
        console.log('Keep-alive stopped');
    }
}
function safeSendMessage(conversation, message) {
    if (!conversation) {
        console.error('No active conversation to send message to');
        return false;
    }
    
    // Check if the conversation has a WebSocket and it's in the right state
    if (conversation._socket && conversation._socket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not open. State:', conversation._socket.readyState);
        return false;
    }
    
    try {
        // Try different methods to send the message
        if (typeof conversation.sendTextMessage === 'function') {
            conversation.sendTextMessage(message);
            console.log('Message sent using sendTextMessage');
        } else if (typeof conversation.sendUserMessage === 'function') {
            conversation.sendUserMessage(message);
            console.log('Message sent using sendUserMessage');
        } else if (typeof conversation.prompt === 'function') {
            conversation.prompt(message);
            console.log('Message sent using prompt');
        } else if (typeof conversation.write === 'function') {
            conversation.write(message);
            console.log('Message sent using write');
        } else if (typeof conversation.ask === 'function') {
            conversation.ask(message);
            console.log('Message sent using ask');
        } else {
            console.error('No suitable message sending method found');
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error sending message:', error);
        return false;
    }
}

// Track if the summary button was clicked to request a summary
let summarizeRequested = false;

async function endConversation() {
    console.log('Ending conversation...');
    
    // End scripted conversation if active
    if (audioContext || mediaStream) {
        console.log('Ending scripted conversation...');
        endScriptedConversation();
        return;
    }
    
    // End regular conversation with proper WebSocket cleanup
    if (conversation) {
        try {
            console.log('Attempting to end conversation session...');
            
            // Create a promise that resolves when the WebSocket is fully closed
            const closePromise = new Promise((resolve) => {
                const originalOnDisconnect = conversation.onDisconnect;
                conversation.onDisconnect = () => {
                    console.log('WebSocket fully closed');
                    if (originalOnDisconnect) originalOnDisconnect();
                    resolve();
                };
            });
            
            await conversation.endSession();
            console.log('Conversation endSession called');
            
            // Wait for the WebSocket to fully close
            await closePromise;
            console.log('Conversation ended successfully');
            
        } catch (error) {
            console.error('Error ending conversation:', error);
            // Continue with cleanup even if endSession fails
        } finally {
            conversation = null;
            isConnecting = false;
            connectionReadyPromise = null;
            stopKeepAlive(); // Stop keep-alive mechanism
            console.log('Conversation variable reset to null');
        }
    } else {
        console.log('No active conversation to end');
    }
    
    // Add a delay to ensure complete cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
}

// Function to safely create a new conversation session with proper WebSocket management
async function createNewConversation(config) {
    if (isConnecting) {
        console.log('Already connecting, waiting for current connection...');
        if (connectionReadyPromise) {
            await connectionReadyPromise;
        }
        return conversation;
    }
    
    isConnecting = true;
    
    try {
        console.log('Creating new conversation session...');
        
        // Create a promise that resolves when the connection is fully established
        connectionReadyPromise = new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, 10000); // 10 second timeout
            
            const originalOnConnect = config.onConnect;
            const originalOnError = config.onError;
            
            config.onConnect = () => {
                clearTimeout(timeoutId);
                isConnecting = false;
                console.log('WebSocket connection fully established');
                startKeepAlive(); // Start keep-alive mechanism
                if (originalOnConnect) originalOnConnect();
                resolve();
            };
            
            config.onError = (error) => {
                clearTimeout(timeoutId);
                isConnecting = false;
                console.error('WebSocket connection error:', error);
                if (originalOnError) originalOnError(error);
                reject(error);
            };
        });
        
        // Start the session
        conversation = await Conversation.startSession(config);
        
        // Wait for the connection to be fully established
        await connectionReadyPromise;
        
        return conversation;
        
    } catch (error) {
        isConnecting = false;
        connectionReadyPromise = null;
        throw error;
    }
}

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
            
            // Prepare the summary message with clear instructions
            const summaryPrompt = "Please summarize our entire debate so far with key points from both sides.";
            
            // Use the safe message sending function
            const messageSent = safeSendMessage(conversation, summaryPrompt);
            
            if (!messageSent) {
                throw new Error('Failed to send summary request - WebSocket may be closed');
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

// Q&A with Nelson Mandela
async function startQnA() {
    try {
        console.log('Starting Q&A with Nelson Mandela...');
        
        // End any existing conversation first with proper cleanup
        if (conversation) {
            console.log('Ending existing conversation before starting Q&A...');
            await endConversation();
            // Wait to ensure complete cleanup and WebSocket closure
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Clear any lingering conversation reference
        conversation = null;
        isConnecting = false;
        connectionReadyPromise = null;
        
        // Request microphone permission first
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
            alert('Microphone permission is required for the Q&A session.');
            return;
        }
        
        // Set form controls state
        setFormControlsState(true);
        
        // Force select Nelson Mandela
        selectOpponent('nelson');
        
        // Get signed URL for Nelson Mandela - ensure fresh URL for new session
        const signedUrl = await getSignedUrl('nelson');
        
        console.log('Creating Q&A conversation with signed URL...');
        
        // Create new conversation with improved WebSocket management
        await createNewConversation({
            signedUrl,
            onConnect: () => {
                console.log('Q&A session connected successfully');
                updateStatus(true);
                updateSpeakingStatus({ mode: 'listening' });
                
                // Update UI after successful connection with longer delay
                setTimeout(() => {
                    // Hide Q&A button and show end button
                    document.getElementById('qnaButton').style.display = 'none';
                    document.getElementById('startScriptedAI').style.display = 'none';
                    document.getElementById('endButton').style.display = 'flex';
                    document.getElementById('startButton').style.display = 'none';
                    document.getElementById('summaryButton').style.display = 'none';
                    console.log('Q&A UI updated - ready for interaction');
                }, 1000);
            },
            onDisconnect: () => {
                console.log('Q&A session disconnected');
                updateStatus(false);
                updateSpeakingStatus({ mode: 'agent_silent' });
                stopMouthAnimation();
                setFormControlsState(false);
                stopKeepAlive(); // Stop keep-alive when disconnected
                
                // Reset button visibility
                document.getElementById('qnaButton').style.display = 'block';
                document.getElementById('startScriptedAI').style.display = 'flex';
                document.getElementById('endButton').style.display = 'none';
                document.getElementById('startButton').style.display = 'flex';
                document.getElementById('summaryButton').style.display = 'none';
            },
            onError: (error) => {
                console.error('Q&A session error:', error);
                updateStatus(false);
                updateSpeakingStatus({ mode: 'agent_silent' });
                stopMouthAnimation();
                setFormControlsState(false);
                
                // Reset button visibility
                document.getElementById('qnaButton').style.display = 'block';
                document.getElementById('startScriptedAI').style.display = 'flex';
                document.getElementById('endButton').style.display = 'none';
                document.getElementById('startButton').style.display = 'flex';
                document.getElementById('summaryButton').style.display = 'none';
                
                alert('An error occurred during the Q&A session.');
            },
            onModeChange: (mode) => {
                console.log('Q&A mode changed:', mode);
                updateSpeakingStatus(mode);
                
                if (mode.mode === 'speaking') {
                    startMouthAnimation();
                } else {
                    stopMouthAnimation();
                }
            }
        });

        console.log('Q&A conversation session created successfully');

    } catch (error) {
        console.error('Error starting Q&A:', error);
        setFormControlsState(false);
        
        // Reset button visibility on error
        document.getElementById('qnaButton').style.display = 'block';
        document.getElementById('startScriptedAI').style.display = 'flex';
        document.getElementById('endButton').style.display = 'none';
        document.getElementById('startButton').style.display = 'flex';
        document.getElementById('summaryButton').style.display = 'none';
        
        alert('Failed to start Q&A session. Please check your internet connection and try again.');
    }
}

// Scripted Conversation
let audioContext;
let mediaStream;
let analyser;
let dataArray;

async function startMicMonitoring() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContext.createMediaStreamSource(mediaStream);
    analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.fftSize = 512;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
}

function isUserSpeaking(threshold = 15) {
    analyser.getByteFrequencyData(dataArray);
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    return avg > threshold;
}

async function waitForUserToStopSpeaking(silenceDuration = 2000, pollInterval = 200) {
    let silentFor = 0;
    return new Promise(resolve => {
        const check = () => {
            if (!isUserSpeaking()) {
                silentFor += pollInterval;
                if (silentFor >= silenceDuration) {
                    resolve();
                    return;
                }
            } else {
                silentFor = 0; // Reset timer if user speaks again
            }
            setTimeout(check, pollInterval);
        };
        check();
    });
}

// Change avatar for scripted conversation
function changeAvatar(name) {
    selectOpponent('taylor');
    initializeAvatar();
}

const playScriptLine = (index) => {
    return new Promise((resolve, reject) => {
        const fileNumber = index + 1;
        const filePath = `/audios/${fileNumber}.mp3`;

        console.log(`Attempting to load audio file: ${filePath}`);
        const audio = new Audio(filePath);

        audio.onended = () => {
            console.log(`Audio ${fileNumber} finished playing`);
            resolve();
        };

        audio.onerror = (e) => {
            console.error(`Error loading audio file: ${filePath}`, e);
            console.error('Audio error details:', audio.error);
            reject(new Error(`Failed to load audio file: ${filePath}`));
        };

        audio.onloadstart = () => {
            console.log(`Started loading audio: ${filePath}`);
        };

        audio.oncanplay = () => {
            console.log(`Audio can play: ${filePath}`);
        };

        audio.play().then(() => {
            console.log(`Playing: ${filePath}`);
            // Start mouth animation during playback
            startMouthAnimation();
        }).catch(err => {
            console.error(`Playback failed: ${filePath}`, err);
            reject(err);
        });
    });
};

async function startScriptedAI() {
    try {
        console.log('Starting scripted TAIlor Swift conversation...');
        
        // End any existing conversation first
        if (conversation || audioContext || mediaStream) {
            console.log('Ending existing session before starting scripted conversation...');
            await endConversation();
            // Wait a moment to ensure cleanup is complete
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Request microphone permission
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
            alert('Microphone permission is required for the scripted conversation.');
            return;
        }

        // Change avatar to Taylor Swift
        changeAvatar("TAIlor Swift");
        console.log('Avatar changed to Taylor Swift');
        
        // Update UI - disable form controls and hide other buttons
        setFormControlsState(true);
        document.getElementById('startScriptedAI').style.display = 'none';
        document.getElementById('startButton').style.display = 'none';
        document.getElementById('qnaButton').style.display = 'none';
        document.getElementById('endButton').style.display = 'flex';
        document.getElementById('summaryButton').style.display = 'none';
        
        // Update status
        updateStatus(true);

        console.log('Starting microphone monitoring...');
        await startMicMonitoring();

        console.log('Beginning scripted conversation with 7 audio files...');
        for (let i = 0; i < 7; i++) {
            console.log(`Now playing line ${i + 1} of 7`);
            updateSpeakingStatus({ mode: 'speaking' });
            
            await playScriptLine(i);
            
            // Stop mouth animation when audio ends
            stopMouthAnimation();
            updateSpeakingStatus({ mode: 'listening' });

            if (i < 6) { // Don't wait after the last audio
                console.log(`Waiting for user silence after line ${i + 1}...`);
                await waitForUserToStopSpeaking();
                console.log(`Silence detected after line ${i + 1}. Proceeding to next line.`);
            }
        }

        console.log('All audio lines completed successfully');
        alert("Script complete. Thank you!");
        
        // Reset UI
        endScriptedConversation();
        
    } catch (err) {
        console.error("Error during script:", err);
        alert(`Something went wrong during the scripted playback: ${err.message}`);
        endScriptedConversation();
    }
}

function endScriptedConversation() {
    // Clean up audio context
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    
    // Stop keep-alive if it was running
    stopKeepAlive();
    
    // Reset UI
    setFormControlsState(false);
    document.getElementById('startScriptedAI').style.display = 'flex';
    document.getElementById('startButton').style.display = 'flex';
    document.getElementById('qnaButton').style.display = 'block';
    document.getElementById('endButton').style.display = 'none';
    document.getElementById('summaryButton').style.display = 'none';
    
    // Reset status
    updateStatus(false);
    updateSpeakingStatus({ mode: 'agent_silent' });
    stopMouthAnimation();
}

document.getElementById('startButton').addEventListener('click', startConversation);
document.getElementById('endButton').addEventListener('click', endConversation);
document.getElementById('summaryButton').addEventListener('click', summarizeConversation);
document.getElementById('qnaButton').addEventListener('click', startQnA);
document.getElementById('startScriptedAI').addEventListener('click', startScriptedAI);

// Initialize avatar when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeAvatar();
    
    // Enable start button when topic and opponent are selected
    const topicSelect = document.getElementById('topic');
    const startButton = document.getElementById('startButton');
    const endButton = document.getElementById('endButton');
    const summaryButton = document.getElementById('summaryButton');
    
    // Ensure initial button states
    endButton.style.display = 'none';
    summaryButton.style.display = 'none';
    document.getElementById('startScriptedAI').style.display = 'flex';
    document.getElementById('qnaButton').style.display = 'block';
    
    function checkFormValidity() {
        const topicSelected = topicSelect.value !== '';
        const opponentSelected = getSelectedOpponent() !== '';
        startButton.disabled = !(topicSelected && opponentSelected);
    }
    
    // Make checkFormValidity globally accessible
    window.checkFormValidity = checkFormValidity;
    
    // Add event listeners for all form controls
    topicSelect.addEventListener('change', checkFormValidity);
    
    // Add event listeners for opponent buttons
    document.querySelectorAll('.opponent-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const opponentValue = e.currentTarget.getAttribute('data-opponent');
            selectOpponent(opponentValue);
        });
    });
    
    // Initial check
    checkFormValidity();
});

window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});