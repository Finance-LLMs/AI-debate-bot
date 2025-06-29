// --- src/app.js ---
import { Conversation } from '@elevenlabs/client';

let conversation = null;
let mouthAnimationInterval = null;
let currentMouthState = 'M130,170 Q150,175 170,170'; // closed mouth
let currentAgentIndex = 0; // 0: Nelson, 1: Taylor, 2: Michelle
let agentSequence = ['nelson', 'taylor', 'michelle']; // Agent rotation sequence
let conversationChain = []; // Store conversation IDs for the chain
let humanTurnCount = 0;
let waitingForHuman = false;
let currentConversationId = null; // Track current conversation ID

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
    const currentAgent = agentSequence[currentAgentIndex];
    
    if (avatarWrapper) {
        if (currentAgent) {
            avatarWrapper.innerHTML = createCelebrityAvatar(currentAgent);
        } else {
            avatarWrapper.innerHTML = createAvatarSVG();
        }
    }
    
    // Update agent indicator
    updateAgentIndicator();
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

async function getSignedUrl(agent) {
    try {
        // Use provided agent or current agent in sequence
        const currentAgent = agent || agentSequence[currentAgentIndex];
        const url = `/api/signed-url?opponent=${currentAgent}`;
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

// Update agent indicator to show current agent and sequence
function updateAgentIndicator() {
    let agentIndicator = document.getElementById('agentIndicator');
    if (!agentIndicator) {
        // Create agent indicator if it doesn't exist
        agentIndicator = document.createElement('div');
        agentIndicator.id = 'agentIndicator';
        agentIndicator.className = 'agent-indicator';
        document.querySelector('.debate-container').appendChild(agentIndicator);
    }
    
    const agentNames = {
        'nelson': 'Nelson Mandela',
        'taylor': 'Taylor Swift',
        'michelle': 'Michelle Chong'
    };
    
    let indicatorHTML = '<div class="agent-sequence">';
    indicatorHTML += '<h3>Agent Transfer Sequence</h3>';
    indicatorHTML += '<div class="sequence-description">Nelson → Taylor → Michelle → Nelson...</div>';
    indicatorHTML += '<div class="agents-list">';
    
    // Create agent rotation display
    agentSequence.forEach((agent, index) => {
        const isActive = index === currentAgentIndex;
        const status = isActive ? 'active' : (index < currentAgentIndex ? 'completed' : 'pending');
        
        indicatorHTML += `
            <div class="agent-item ${status}">
                <div class="agent-number">${index + 1}</div>
                <div class="agent-name">${agentNames[agent]}</div>
                <div class="agent-status">${isActive ? 'Current' : (index < currentAgentIndex ? 'Done' : 'Next')}</div>
            </div>
        `;
    });
    
    indicatorHTML += '</div></div>';
    agentIndicator.innerHTML = indicatorHTML;
}

// Move to next agent in sequence
function moveToNextAgent() {
    currentAgentIndex = (currentAgentIndex + 1) % agentSequence.length;
    initializeAvatar();
    updateAgentIndicator();
    return true; // Always return true as we cycle through agents
}

// Reset agent sequence
function resetAgentSequence() {
    currentAgentIndex = 0;
    conversationChain = [];
    humanTurnCount = 0;
    waitingForHuman = false;
    currentConversationId = null;
    hideUserPrompt();
    initializeAvatar();
    updateAgentIndicator();
    updateTransferButtonText(); // Update button text for first agent
    resetTurnTracking();
}


// Function to disable/enable form controls
function setFormControlsState(disabled) {
    const topicSelect = document.getElementById('topic');
    const transferButton = document.getElementById('transferButton');
    
    topicSelect.disabled = disabled;
    
    // Don't disable transfer button when form is disabled - it should be controlled separately
    if (transferButton && !disabled) {
        transferButton.disabled = false;
    }
}

async function startConversation() {
    const startButton = document.getElementById('startButton');
    const endButton = document.getElementById('endButton');
    const transferButton = document.getElementById('transferButton');
    const summaryButton = document.getElementById('summaryButton');
    
    try {
        // Reset agent sequence to start from the beginning
        resetAgentSequence();
        
        // Disable start button immediately to prevent multiple clicks
        startButton.disabled = true;
        
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
            alert('Microphone permission is required for the conversation.');
            startButton.disabled = false;
            return;
        }
        
        // Get signed URL for current agent
        const signedUrl = await getSignedUrl();
        console.log('Signed URL received:', signedUrl);
        
        // Try to extract conversation ID from signed URL
        try {
            const url = new URL(signedUrl);
            const urlParams = new URLSearchParams(url.search);
            const pathConversationId = url.pathname.match(/conversations?\/([a-f0-9\-]+)/i);
            
            let extractedId = urlParams.get('conversation_id') || 
                            urlParams.get('conversationId') ||
                            urlParams.get('id') ||
                            (pathConversationId && pathConversationId[1]);
            
            if (extractedId) {
                currentConversationId = extractedId;
                console.log('Pre-extracted conversation ID from signed URL:', currentConversationId);
            }
        } catch (error) {
            console.log('Could not extract conversation ID from signed URL:', error);
        }
        //const agentId = await getAgentId(); // You can switch to agentID for public agents
        
        // Set user stance to "for" and AI stance to "against" by default
        const userStance = "for";
        const aiStance = "against";
        
        // Get the actual topic text instead of the value
        const topicSelect = document.getElementById('topic');
        const topicText = topicSelect.options[topicSelect.selectedIndex].text;
        
        conversation = await Conversation.startSession({
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
                endButton.disabled = false;
                endButton.style.display = 'flex';
                transferButton.disabled = false;
                transferButton.style.display = 'flex';
                updateTransferButtonText(); // Use the new function
                summaryButton.disabled = false;
                summaryButton.style.display = 'flex';
                
                // Show debug button for troubleshooting
                const debugButton = document.getElementById('debugButton');
                if (debugButton) {
                    debugButton.style.display = 'flex';
                }
                
                // Store conversation ID for the chain - try multiple ways to get it
                setTimeout(() => {
                    let conversationId = null;
                    if (conversation) {
                        // Try different properties where the ID might be stored
                        conversationId = conversation.conversationId || 
                                       conversation.id || 
                                       conversation._conversationId ||
                                       conversation.conversation_id ||
                                       (conversation.connection && conversation.connection.conversationId) ||
                                       (conversation.connection && conversation.connection.id) ||
                                       (conversation.options && conversation.options.conversationId) ||
                                       (conversation.options && conversation.options.agentId);
                        
                        // Try to extract from WebSocket URL if available
                        if (!conversationId && conversation.connection && conversation.connection.url) {
                            const url = conversation.connection.url;
                            console.log('WebSocket URL:', url);
                            
                            // Look for conversation ID in URL parameters or path
                            const urlParams = new URLSearchParams(url.split('?')[1] || '');
                            conversationId = urlParams.get('conversation_id') || 
                                           urlParams.get('conversationId') ||
                                           urlParams.get('id');
                            
                            // If still not found, try to extract from URL path
                            if (!conversationId) {
                                const pathMatch = url.match(/conversations?\/([a-f0-9\-]+)/i);
                                if (pathMatch) {
                                    conversationId = pathMatch[1];
                                    console.log('Extracted conversation ID from URL path:', conversationId);
                                }
                            }
                        }
                        
                        // Try to get it from any UUID-like string in the connection
                        if (!conversationId && conversation.connection) {
                            const connStr = JSON.stringify(conversation.connection);
                            const uuidMatch = connStr.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);
                            if (uuidMatch) {
                                conversationId = uuidMatch[0];
                                console.log('Extracted UUID from connection:', conversationId);
                            }
                        }
                    }
                    
                    if (conversationId) {
                        currentConversationId = conversationId;
                        console.log('Captured conversation ID:', currentConversationId);
                        conversationChain.push({
                            agent: agentSequence[currentAgentIndex],
                            conversationId: conversationId
                        });
                    } else {
                        console.warn('Could not capture conversation ID immediately - will try message handlers');
                        
                        // Log all properties for debugging
                        console.log('Full conversation object for debugging:', conversation);
                    }
                }, 1000); // Give it a moment to initialize
            },            
            onDisconnect: () => {
                console.log('Disconnected');
                updateStatus(false);
                setFormControlsState(false); // Re-enable form controls
                startButton.disabled = false;
                startButton.style.display = 'flex';
                endButton.disabled = true;
                endButton.style.display = 'none';
                transferButton.disabled = true;
                transferButton.style.display = 'none';
                summaryButton.disabled = true;
                summaryButton.style.display = 'none';
                
                // Hide debug button
                const debugButton = document.getElementById('debugButton');
                if (debugButton) {
                    debugButton.style.display = 'none';
                }
                
                updateSpeakingStatus({ mode: 'listening' }); // Reset to listening mode on disconnect
                stopMouthAnimation(); // Ensure avatar animation stops
                
                // Continue the debate sequence - always show prompt for human turn after agent finishes
                // The sequence will cycle through all agents: Nelson -> Taylor -> Michelle -> Nelson...
                showUserPrompt();
            },
            onError: (error) => {
                console.error('Conversation error:', error);
                setFormControlsState(false); // Re-enable form controls on error
                startButton.disabled = false;
                startButton.style.display = 'flex';
                endButton.disabled = true;
                endButton.style.display = 'none';
                transferButton.disabled = true;
                transferButton.style.display = 'none';
                summaryButton.disabled = true;
                summaryButton.style.display = 'none';
                alert('An error occurred during the conversation.');
            },
            onModeChange: (mode) => {
                console.log('Mode changed:', mode); // Debug log to see exact mode object
                updateSpeakingStatus(mode);
            },
            onMessage: (message) => {
                console.log('Received message:', message);
                
                // Try to capture conversation ID from message events
                if (message && !currentConversationId) {
                    const possibleId = message.conversation_id || 
                                     message.conversationId || 
                                     message.id ||
                                     (message.metadata && message.metadata.conversation_id) ||
                                     (message.metadata && message.metadata.conversationId) ||
                                     (message.data && message.data.conversation_id) ||
                                     (message.data && message.data.conversationId);
                    
                    if (possibleId) {
                        currentConversationId = possibleId;
                        console.log('Captured conversation ID from message:', currentConversationId);
                    } else {
                        // Try to find any UUID in the message
                        const messageStr = JSON.stringify(message);
                        const uuidMatch = messageStr.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);
                        if (uuidMatch) {
                            currentConversationId = uuidMatch[0];
                            console.log('Extracted conversation ID from message UUID:', currentConversationId);
                        }
                    }
                }
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

// Transfer to next agent with conversation context
async function transferAgent() {
    const transferButton = document.getElementById('transferButton');
    
    try {
        transferButton.disabled = true;
        transferButton.classList.add('loading');
        transferButton.textContent = 'Transferring...';
        
        // Debug: Check conversation object and ID
        console.log('Current conversation object:', conversation);
        console.log('Current conversation ID:', currentConversationId);
        
        // Try to get conversation ID from the conversation object if currentConversationId is not set
        let conversationIdToUse = currentConversationId;
        if (!conversationIdToUse && conversation) {
            // Try different properties where the ID might be stored
            conversationIdToUse = conversation.conversationId || 
                                 conversation.id || 
                                 conversation._conversationId ||
                                 conversation.conversation_id ||
                                 (conversation.connection && conversation.connection.conversationId) ||
                                 (conversation.connection && conversation.connection.id) ||
                                 (conversation.options && conversation.options.conversationId);
            
            // Try to extract from WebSocket URL if available
            if (!conversationIdToUse && conversation.connection && conversation.connection.url) {
                const url = conversation.connection.url;
                console.log('Trying to extract ID from WebSocket URL:', url);
                
                // Look for conversation ID in URL parameters
                const urlParams = new URLSearchParams(url.split('?')[1] || '');
                conversationIdToUse = urlParams.get('conversation_id') || 
                                     urlParams.get('conversationId') ||
                                     urlParams.get('id');
                
                // If still not found, try to extract from URL path
                if (!conversationIdToUse) {
                    const pathMatch = url.match(/conversations?\/([a-f0-9\-]+)/i);
                    if (pathMatch) {
                        conversationIdToUse = pathMatch[1];
                        console.log('Extracted conversation ID from URL path:', conversationIdToUse);
                    }
                }
            }
            
            console.log('Found conversation ID from conversation object:', conversationIdToUse);
        }
        
        if (!conversationIdToUse) {
            // If still no conversation ID, check if there's one in the conversation chain
            if (conversationChain.length > 0) {
                conversationIdToUse = conversationChain[conversationChain.length - 1].conversationId;
                console.log('Using conversation ID from chain:', conversationIdToUse);
            }
        }
        
        // Last resort: try to get the most recent conversation from the backend
        if (!conversationIdToUse) {
            console.log('Attempting to get conversation ID from backend...');
            try {
                const response = await fetch('/api/recent-conversation');
                if (response.ok) {
                    const data = await response.json();
                    conversationIdToUse = data.conversationId;
                    console.log('Got conversation ID from backend:', conversationIdToUse);
                }
            } catch (error) {
                console.log('Could not get conversation ID from backend:', error);
            }
        }
        
        if (!conversationIdToUse) {
            console.error('No conversation ID available for transfer');
            alert('No active conversation to transfer. Please start a conversation first and wait a moment before transferring.');
            return;
        }
        
        console.log(`Transferring conversation ID: ${conversationIdToUse}`);
        
        // End current conversation
        if (conversation) {
            await conversation.endSession();
            conversation = null;
        }
        
        // Call backend to transfer agent
        const response = await fetch('/transfer-agent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversationId: conversationIdToUse
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to transfer agent');
        }
        
        const transferData = await response.json();
        console.log('Transfer response:', transferData);
        
        // Update current agent index
        currentAgentIndex = (currentAgentIndex + 1) % 3;
        
        // Start new conversation with next agent
        await startNewAgentConversation(transferData);
        
        // Update UI to reflect new agent
        initializeAvatar();
        updateAgentIndicator();
        
        // Ensure transfer button is visible and updated after successful transfer
        const transferButtonAfterTransfer = document.getElementById('transferButton');
        if (transferButtonAfterTransfer) {
            transferButtonAfterTransfer.style.display = 'flex';
            transferButtonAfterTransfer.disabled = false;
        }
        updateTransferButtonText();
        
    } catch (error) {
        console.error('Error transferring agent:', error);
        alert('Failed to transfer agent: ' + error.message);
    } finally {
        transferButton.disabled = false;
        transferButton.classList.remove('loading');
        updateTransferButtonText(); // Reset button text properly
    }
}

// Start conversation with new agent using context
async function startNewAgentConversation(transferData) {
    try {
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
            throw new Error('Microphone permission denied');
        }
        
        // Get the actual topic text
        const topicSelect = document.getElementById('topic');
        const topicText = topicSelect.options[topicSelect.selectedIndex].text;
        
        conversation = await Conversation.startSession({
            signedUrl: transferData.signedUrl,
            dynamicVariables: {
                topic: topicText,
                user_stance: "for",
                ai_stance: "against",
                conversation_context: transferData.conversationContext || ""
            },
            onConnect: () => {
                console.log(`Connected to ${transferData.nextAgent}`);
                updateStatus(true);
                
                // Ensure transfer button is visible and properly updated
                const transferButton = document.getElementById('transferButton');
                const endButton = document.getElementById('endButton');
                const summaryButton = document.getElementById('summaryButton');
                
                if (transferButton) {
                    transferButton.disabled = false;
                    transferButton.style.display = 'flex';
                    updateTransferButtonText(); // Update button text for next agent
                }
                
                if (endButton) {
                    endButton.disabled = false;
                    endButton.style.display = 'flex';
                }
                
                if (summaryButton) {
                    summaryButton.disabled = false;
                    summaryButton.style.display = 'flex';
                }
                
                // Capture conversation ID for the new agent
                setTimeout(() => {
                    let conversationId = null;
                    if (conversation) {
                        conversationId = conversation.conversationId || 
                                       conversation.id || 
                                       conversation._conversationId ||
                                       conversation.conversation_id;
                    }
                    
                    if (conversationId) {
                        currentConversationId = conversationId;
                        console.log('Captured new conversation ID:', currentConversationId);
                    }
                }, 1000);
            },
            onDisconnect: () => {
                console.log(`Disconnected from ${transferData.nextAgent}`);
                updateStatus(false);
                
                // Don't hide the transfer button on disconnect from new agent
                // The button should remain visible for further transfers
                console.log('Maintaining transfer button visibility after agent disconnect');
            },
            onError: (error) => {
                console.error('Conversation error:', error);
                alert('An error occurred during the conversation.');
            },
            onModeChange: (mode) => {
                updateSpeakingStatus(mode);
            },
            onMessage: (message) => {
                console.log('Received message in new conversation:', message);
                
                // Try to capture conversation ID from message events
                if (message && !currentConversationId) {
                    const possibleId = message.conversation_id || 
                                     message.conversationId || 
                                     message.id ||
                                     (message.metadata && message.metadata.conversation_id);
                    
                    if (possibleId) {
                        currentConversationId = possibleId;
                        console.log('Captured conversation ID from new message:', currentConversationId);
                    }
                }
            }
        });
        
        // Store new conversation ID (fallback)
        if (conversation && conversation.conversationId) {
            currentConversationId = conversation.conversationId;
        }
        
    } catch (error) {
        console.error('Error starting new agent conversation:', error);
        throw error;
    }
}

// Get the name of the next agent in sequence
function getNextAgentName() {
    const nextIndex = (currentAgentIndex + 1) % 3;
    const agentNames = ['Nelson Mandela', 'Taylor Swift', 'Michelle Chong'];
    const nextAgent = agentNames[nextIndex];
    
    console.log(`getNextAgentName: currentAgentIndex = ${currentAgentIndex}, nextIndex = ${nextIndex}, nextAgent = ${nextAgent}`);
    
    return nextAgent;
}

// Update transfer button text based on current agent sequence
function updateTransferButtonText() {
    const transferButton = document.getElementById('transferButton');
    if (transferButton) {
        const nextAgentName = getNextAgentName();
        console.log(`Updating transfer button: current agent index = ${currentAgentIndex}, next agent = ${nextAgentName}`);
        
        transferButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2-2z"/>
                <path d="M8 21v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"/>
                <polyline points="9,9 12,12 15,9"/>
            </svg>
            Transfer to ${nextAgentName}
        `;
        
        console.log(`Transfer button updated to: Transfer to ${nextAgentName}`);
    } else {
        console.log('Transfer button not found in DOM');
    }
}

// Debug function to check conversation state
function debugConversationState() {
    console.log('=== Conversation Debug Info ===');
    console.log('Current conversation object:', conversation);
    console.log('Current conversation ID:', currentConversationId);
    console.log('Current agent index:', currentAgentIndex);
    console.log('Current agent:', agentSequence[currentAgentIndex]);
    console.log('Conversation chain:', conversationChain);
    
    if (conversation) {
        console.log('Conversation properties:');
        console.log('- conversationId:', conversation.conversationId);
        console.log('- id:', conversation.id);
        console.log('- _conversationId:', conversation._conversationId);
        console.log('- conversation_id:', conversation.conversation_id);
        
        // Check connection object for ID
        if (conversation.connection) {
            console.log('Connection object:', conversation.connection);
            console.log('- connection.conversationId:', conversation.connection.conversationId);
            console.log('- connection.id:', conversation.connection.id);
            console.log('- connection.url:', conversation.connection.url);
        }
        
        // Check options object for ID
        if (conversation.options) {
            console.log('Options object:', conversation.options);
            console.log('- options.conversationId:', conversation.options.conversationId);
            console.log('- options.agentId:', conversation.options.agentId);
        }
        
        // Try to find any property that looks like an ID
        console.log('All conversation properties:');
        Object.keys(conversation).forEach(key => {
            const value = conversation[key];
            console.log(`- ${key}:`, value);
            
            // If it's an object, check its properties too
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                Object.keys(value).forEach(subKey => {
                    if (subKey.toLowerCase().includes('id') || subKey.toLowerCase().includes('conversation')) {
                        console.log(`  - ${key}.${subKey}:`, value[subKey]);
                    }
                });
            }
        });
        
        // Check prototype for methods
        console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(conversation)));
    }
    console.log('===============================');
}

// Make debug function available globally
window.debugConversationState = debugConversationState;

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

// Handle manual human turn completion  
async function completeHumanTurn() {
    await signalHumanTurn();
    hideUserPrompt();
    
    // The agent transfer happens via the Transfer button, not automatically
    // This function just completes the human's turn, allowing them to use the Transfer button
    console.log('Human turn completed, ready for transfer to next agent');
}

// Show summary of entire debate
function showDebateSummary() {
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'debate-summary';
    summaryDiv.innerHTML = `
        <div class="summary-content">
            <h2>Debate Summary</h2>
            <p>The turn-based debate has completed with the following sequence:</p>
            <ul>
                <li>Nelson Mandela → Your Response</li>
                <li>Michelle Chong → Your Response</li>
                <li>Taylor Swift</li>
            </ul>
            <p>Total human turns: ${humanTurnCount}</p>
            <button onclick="this.parentElement.parentElement.remove()" class="close-summary">Close</button>
        </div>
    `;
    document.body.appendChild(summaryDiv);
}

// Function to signal human turn to backend
async function signalHumanTurn() {
    try {
        await fetch('/human-turn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('Human turn signaled to backend');
    } catch (error) {
        console.error('Error signaling human turn:', error);
    }
}

// Function to reset turn tracking
async function resetTurnTracking() {
    try {
        await fetch('/reset-turns', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        humanTurnCount = 0;
        waitingForHuman = false;
        console.log('Turn tracking reset');
    } catch (error) {
        console.error('Error resetting turn tracking:', error);
    }
}

// Show user prompt for their turn
function showUserPrompt() {
    waitingForHuman = true;
    
    // Create or update the user prompt UI
    let promptDiv = document.getElementById('userPrompt');
    if (!promptDiv) {
        promptDiv = document.createElement('div');
        promptDiv.id = 'userPrompt';
        promptDiv.className = 'user-prompt';
        document.querySelector('.debate-container').appendChild(promptDiv);
    }
    
    const agentNames = {
        'nelson': 'Nelson Mandela',
        'michelle': 'Michelle Chong', 
        'taylor': 'Taylor Swift'
    };
    
    const currentAgentName = agentNames[agentSequence[currentAgentIndex - 1]] || 'the agent';
    
    promptDiv.innerHTML = `
        <div class="prompt-content">
            <h3>Your Turn!</h3>
            <p>${currentAgentName} has finished speaking. Please respond to continue the debate.</p>
            <p><strong>Speak now to give your response...</strong></p>
            <button onclick="signalHumanTurn(); hideUserPrompt();" class="manual-turn-button">
                I've finished speaking
            </button>
        </div>
    `;
    
    promptDiv.style.display = 'block';
}

// Hide user prompt
function hideUserPrompt() {
    const promptDiv = document.getElementById('userPrompt');
    if (promptDiv) {
        promptDiv.style.display = 'none';
    }
    waitingForHuman = false;
}

// Make functions globally accessible for onclick handlers
window.signalHumanTurn = signalHumanTurn;
window.hideUserPrompt = hideUserPrompt;
window.completeHumanTurn = completeHumanTurn;
window.transferAgent = transferAgent;

document.getElementById('startButton').addEventListener('click', startConversation);
document.getElementById('endButton').addEventListener('click', endConversation);
document.getElementById('transferButton').addEventListener('click', transferAgent);
document.getElementById('summaryButton').addEventListener('click', summarizeConversation);

// Initialize avatar when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeAvatar();
    
    // Enable start button when topic is selected
    const topicSelect = document.getElementById('topic');
    const startButton = document.getElementById('startButton');
    const endButton = document.getElementById('endButton');
    const transferButton = document.getElementById('transferButton');
    const summaryButton = document.getElementById('summaryButton');
    
    // Ensure initial button states
    endButton.style.display = 'none';
    transferButton.style.display = 'none';
    summaryButton.style.display = 'none';
    
    function checkFormValidity() {
        const topicSelected = topicSelect.value !== '';
        startButton.disabled = !topicSelected;
    }
    
    // Add event listeners for form controls
    topicSelect.addEventListener('change', checkFormValidity);
    
    // Initial check
    checkFormValidity();
});

window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});