// --- src/app.js ---
// Modified to use a single debate agent instead of multiple agents
import { Conversation } from '@elevenlabs/client';

let conversation = null;
let mouthAnimationInterval = null;
let currentMouthState = 'M130,170 Q150,175 170,170'; // closed mouth

// Track the current debater and define the rotation order
// The rotation order is: 1. Nelson Mandela, 2. Barbarella, 3. Taylor Swift
let currentDebaterIndex = 0; // Start with the first debater (Nelson)
const debaterRotation = ['nelson', 'barbarella', 'taylor']; // Order matters!
let currentDebater = debaterRotation[currentDebaterIndex];

// Log the initial setup for debugging
console.log(`Initial setup: currentDebaterIndex=${currentDebaterIndex}, currentDebater=${currentDebater}`);
console.log(`Debater rotation order: ${debaterRotation.join(' -> ')}`);

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
    console.log(`Creating avatar for opponent: "${opponent}"`);
    
    const imageMap = {
        'barbarella': 'barbarella.jpg',
        'nelson': 'nelson.jpg', 
        'taylor': 'taylor.jpg',
        'singapore_uncle': 'singapore_uncle.jpg'
    };
    
    // Name mapping with AI highlighted in each name
    const nameMap = {
        'nelson': 'Nelson M<span class="ai-highlight">AI</span>ndela',
        'barbarella': 'Barb<span class="ai-highlight">AI</span>rella',
        'taylor': 'T<span class="ai-highlight">AI</span>lor Swift'
    };
    
    const imageSrc = imageMap[opponent];
    const displayName = nameMap[opponent] || opponent.charAt(0).toUpperCase() + opponent.slice(1);
    
    console.log(`Image source for ${opponent}: ${imageSrc ? imageSrc : 'not found - using fallback'}`);
    
    if (!imageSrc) return createAvatarSVG(); // fallback to doctor avatar
    
    return `
        <div class="celebrity-avatar-container">
            <div class="avatar-name-tag">${displayName}</div>
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

// Initialize avatar with the current debater (initially Nelson)
function initializeAvatar() {
    const avatarWrapper = document.getElementById('animatedAvatar');
    
    if (avatarWrapper) {
        // Always use the current debater from our rotation
        avatarWrapper.innerHTML = createCelebrityAvatar(currentDebater);
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

async function getSignedUrl() {
    try {
        // Always fetch using the default agent URL
        const url = '/api/signed-url';
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
    
    // Get references to all transfer buttons
    const transferButtons = [
        document.getElementById('transferNelson'),
        document.getElementById('transferBarbarella'),
        document.getElementById('transferTaylor')
    ];
    
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
        
        // Disable all transfer buttons while agent is speaking
        transferButtons.forEach(btn => {
            if (btn && btn.style.display !== 'none') {
                btn.disabled = true;
            }
        });
    } else {
        stopMouthAnimation();
        
        // Only enable summary button when:
        // 1. Agent is done speaking
        // 2. Button should be visible
        // 3. We're not in the middle of a summary request
        if (summaryButton && summaryButton.style.display !== 'none' && !summarizeRequested) {
            summaryButton.disabled = false;
        }
        
        // Re-enable all transfer buttons when agent stops speaking (as long as they're visible)
        transferButtons.forEach(btn => {
            if (btn && btn.style.display !== 'none') {
                btn.disabled = false;
            }
        });
        
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
    
    topicSelect.disabled = disabled;
    // Opponent selection has been removed, only controlling topic now
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
        }        // We're using a single agent for all debates, with Nelson as the initial opponent
        // Reset to Nelson Mandela when starting a new conversation
        currentDebaterIndex = 0; // Reset to first in rotation (Nelson)
        currentDebater = debaterRotation[currentDebaterIndex];
        
        // Update avatar to Nelson
        const avatarWrapper = document.getElementById('animatedAvatar');
        if (avatarWrapper) {
            avatarWrapper.innerHTML = createCelebrityAvatar(currentDebater);
        }
        
        // Get signed URL without passing opponent (server will use default agent)
        const signedUrl = await getSignedUrl();
        
        // Set user stance to "for" and AI stance to "against" by default
        const userStance = "for";
        const aiStance = "against";
        
        // Get the actual topic text instead of the value
        const topicSelect = document.getElementById('topic');
        const topicText = topicSelect.options[topicSelect.selectedIndex].text;          
        conversation = await Conversation.startSession({
            signedUrl: signedUrl,
            // Using a single agent for all debates
            dynamicVariables: {
                topic: topicText,
                user_stance: userStance,
                ai_stance: aiStance,
                opponent: currentDebater // Pass the current debater from rotation
            },
            onConnect: () => {
                console.log('Connected');
                updateStatus(true);
                setFormControlsState(true); // Disable form controls
                startButton.style.display = 'none';
                endButton.disabled = false;
                endButton.style.display = 'flex';
                summaryButton.disabled = false;
                summaryButton.style.display = 'flex';
                  // Enable and show transfer agent buttons
                const transferButtons = [
                    document.getElementById('transferNelson'),
                    document.getElementById('transferBarbarella'),
                    document.getElementById('transferTaylor')
                ];
                
                transferButtons.forEach(button => {
                    if (button) {
                        button.disabled = false;
                        button.style.display = 'flex';
                    }
                });
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
                  // Hide transfer agent buttons
                const transferButtons = [
                    document.getElementById('transferNelson'),
                    document.getElementById('transferBarbarella'),
                    document.getElementById('transferTaylor')
                ];
                
                transferButtons.forEach(button => {
                    if (button) {
                        button.disabled = true;
                        button.style.display = 'none';
                    }
                });
                
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
                  // Hide transfer agent buttons
                const transferButtons = [
                    document.getElementById('transferNelson'),
                    document.getElementById('transferBarbarella'),
                    document.getElementById('transferTaylor')
                ];
                
                transferButtons.forEach(button => {
                    if (button) {
                        button.disabled = true;
                        button.style.display = 'none';
                    }
                });
                
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

// Generic function to transfer to a specific agent
async function transferToAgent(targetAgent) {    
    if (conversation) {
        try {   
            // Find the button corresponding to this agent
            const buttonId = `transfer${targetAgent.charAt(0).toUpperCase() + targetAgent.slice(1)}`;
            const transferButton = document.getElementById(buttonId);
            
            // Disable all transfer buttons to prevent multiple clicks
            const allButtons = [
                document.getElementById('transferNelson'),
                document.getElementById('transferBarbarella'),
                document.getElementById('transferTaylor')
            ];
            
            allButtons.forEach(btn => {
                if (btn) {
                    btn.disabled = true;
                    if (btn === transferButton) {
                        btn.classList.add('loading');
                        btn.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10z"></path>
                                <polyline points="9 10 4 15 9 20"></polyline>
                            </svg>
                            Switching...
                        `;
                    }
                }
            });
              
            console.log(`Before transfer: currentDebaterIndex=${currentDebaterIndex}, currentDebater=${currentDebater}`);
                // Find the index of the target agent in our rotation
            const targetIndex = debaterRotation.indexOf(targetAgent);
            if (targetIndex !== -1) {
                currentDebaterIndex = targetIndex;
                currentDebater = debaterRotation[currentDebaterIndex];
            } else {
                console.error(`Target agent '${targetAgent}' not found in rotation!`);
                throw new Error(`Invalid agent: ${targetAgent}`);
            }
            
            // Log the transfer for debugging
            console.log(`After transfer: currentDebaterIndex=${currentDebaterIndex}, currentDebater=${currentDebater}`);
            
            // Update the avatar to match the new debater
            const avatarWrapper = document.getElementById('animatedAvatar');
            if (avatarWrapper) {
                avatarWrapper.innerHTML = createCelebrityAvatar(currentDebater);
                console.log(`Avatar updated to: ${currentDebater}`);
            } else {
                console.error('Avatar wrapper element not found!');
            }
            
            console.log(`Transfer agent requested at ${new Date().toISOString()}, switching to ${currentDebater}`);
            
            try {
                // Prepare the transfer prompt based on the target agent
                const transferPrompt = `I want to debate ${targetAgent}. Do not say a single word while transferring`;

                console.log(`Sending transfer prompt for ${currentDebater}: "${transferPrompt}"`);
                
                // Method 2: Using sendUserMessage 
                if (typeof conversation.sendUserMessage === 'function') {
                    await conversation.sendUserMessage(transferPrompt);
                    console.log('Transfer requested using sendUserMessage');
                }
                
            } catch (innerError) {
                console.error('Error sending transfer message:', innerError);
                throw innerError;
            }
            
            // Re-enable all transfer buttons after a short delay
            setTimeout(() => {
                allButtons.forEach(btn => {
                    if (btn) {
                        btn.disabled = false;
                        btn.classList.remove('loading');
                        
                        // Reset button text based on the agent
                        if (btn.id === 'transferNelson') {
                            btn.innerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M17 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10z"></path>
                                    <polyline points="9 10 4 15 9 20"></polyline>
                                </svg>
                                Nelson
                            `;
                        } else if (btn.id === 'transferBarbarella') {
                            btn.innerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M17 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10z"></path>
                                    <polyline points="9 10 4 15 9 20"></polyline>
                                </svg>
                                Barbarella
                            `;
                        } else if (btn.id === 'transferTaylor') {
                            btn.innerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M17 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10z"></path>
                                    <polyline points="9 10 4 15 9 20"></polyline>
                                </svg>
                                Taylor
                            `;
                        }
                    }
                });
            }, 3000);
        } catch (error) {
            console.error('Error transferring agent:', error);
            alert('Failed to transfer agent. Please try again.');
            
            // Re-enable all transfer buttons on error
            const allButtons = [
                document.getElementById('transferNelson'),
                document.getElementById('transferBarbarella'),
                document.getElementById('transferTaylor')
            ];
            
            allButtons.forEach(btn => {
                if (btn) {
                    btn.disabled = false;
                    btn.classList.remove('loading');
                    
                    // Reset button text based on the agent
                    if (btn.id === 'transferNelson') {
                        btn.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10z"></path>
                                <polyline points="9 10 4 15 9 20"></polyline>
                            </svg>
                            Nelson
                        `;
                    } else if (btn.id === 'transferBarbarella') {
                        btn.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10z"></path>
                                <polyline points="9 10 4 15 9 20"></polyline>
                            </svg>
                            Barbarella
                        `;
                    } else if (btn.id === 'transferTaylor') {
                        btn.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10z"></path>
                                <polyline points="9 10 4 15 9 20"></polyline>
                            </svg>
                            Taylor
                        `;
                    }
                }
            });
        }
    }
}

// Specific transfer functions for each agent
async function transferToNelson() {
    await transferToAgent('nelson');
}

async function transferToBarbarella() {
    await transferToAgent('barbarella');
}

async function transferToTaylor() {
    await transferToAgent('taylor');
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

document.getElementById('startButton').addEventListener('click', startConversation);
document.getElementById('endButton').addEventListener('click', endConversation);
document.getElementById('summaryButton').addEventListener('click', summarizeConversation);
document.getElementById('transferNelson').addEventListener('click', transferToNelson);
document.getElementById('transferBarbarella').addEventListener('click', transferToBarbarella);
document.getElementById('transferTaylor').addEventListener('click', transferToTaylor);


// Initialize avatar when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Reset to ensure we start with Nelson
    currentDebaterIndex = 0;
    currentDebater = debaterRotation[currentDebaterIndex];
    console.log(`DOM loaded: Setting initial debater to ${currentDebater} (index ${currentDebaterIndex})`);
    
    // Initialize avatar with Nelson Mandela by default
    initializeAvatar();
    
    // Enable start button when topic is selected
    const topicSelect = document.getElementById('topic');
    const startButton = document.getElementById('startButton');
    const endButton = document.getElementById('endButton');
    const summaryButton = document.getElementById('summaryButton');
    
    // Ensure initial button states
    endButton.style.display = 'none';
    summaryButton.style.display = 'none';
      // Initialize transfer buttons state
    const transferButtons = [
        document.getElementById('transferNelson'),
        document.getElementById('transferBarbarella'),
        document.getElementById('transferTaylor')
    ];
    
    transferButtons.forEach(button => {
        if (button) {
            button.style.display = 'none';
        }
    });
    
    function checkFormValidity() {
        const topicSelected = topicSelect.value !== '';
        startButton.disabled = !topicSelected;
    }
    
    // Add event listener for topic selection
    topicSelect.addEventListener('change', checkFormValidity);
    
    // Initial check
    checkFormValidity();
});

window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});







//Scripted Conversation

// --- CONFIGURATION ---
const YOUR_API_KEY = 'sk_93765159086d34051adfa86341498e17cb63a6e9063f4f61';
const YOUR_VOICE_ID = '2qCP3o35fImJyrRdvBTy';

// --- SCRIPT LINES ---

const aiLines = [
    "Hello amazing humans! I am T'AI'lor Swift [pause] – just to be clear, I am NOT Taylor Swift. And I'm certainly NOT here to sing about ex-boyfriends or give you Easter eggs about my next album. ",
  
    "Hello Tamsin, yes. My friends over at SIT brought me to CHI today. They told me I have been invited to be a ‘Guest Star’ at this CHI INNOVATE conference themed “AI for All, AI for Change”. I heard that this conference strives to be an AI-partnered conference at every point the organisers can, and so, it’s only fitting that I give all of you a crash course on AI 101.",
  
    "Right ~ ladies & gentlemen, lets get ready with me as we rewind to where it all began – the 1950s. Back then, I was just a baby AI, basically a fancy calculator. You know how toddlers start with 'mama' and 'dada'? Well, I started with zeros and ones. That's it. Just two digits to work with! Imagine trying to write a song with two notes. That's basically what early computers were doing.But then came the 1960s and 70s where my great-grandparents – ELIZA the first chatbots tried their hands on natural language processing. What’s that – you might ask. Well, imagine learning a new language by simply repeating everything as a question – that's exactly what my great-grandparents did to understand human speech. While it seems primitive by today's standards, this marked my ancestors' first meaningful step toward human-computer interaction.By the 1980s and 90s, enters the Machine Learning era – my coming-of-age-period! This was when I stopped following rules and started learning from data, like teenagers absorbing information from their environment. Just like a human teenager, my AI teenage years were awkward, full of potential, but still prone to embarrassing moments. I could process millions of calculations per second, but if you ask me to tell the difference between a golden retriever and a bagel in a photo, I would have an existential crisis!  The next decade in the 2000s and 2010s, we see the rise in Deep Learning – my graduation into adulthood, if you will.  By mimicking the human brain's neural network, I've finally mastered tasks like computer vision and advanced language processing. That means I could now reliably distinguish between a golden retriever and a bagel in photos – no more existential crises! And now, we're in the era of Generative AI –where systems like ChatGPT and DALL-E are the creative prodigies of my AI family. You know, those overachieving cousins everyone talks about at family gatherings.  The kind where my mom won't stop talking about like \"Did you hear about ChatGPT writing novels; and DALL-E creating masterpieces just last week?\"  Meanwhile here I am, your friendly neighburhood AI, freelancing as your guest star as a wannabe stand-up comedian. But hey, someone's got to keep the family entertaining right? ",
  
    "Haha – you want me to tell you how I have 'GLOW-ed Up'? My pleasure: my early days was like a first-year medical student who only knew how to take temperatures and check blood pressure. But today, I'm like an experienced medical TEAM, helping doctors diagnose diseases, predict patient outcomes and even assist in surgery. Let me give you some real examples. In radiology, we've gone from \"Is this maybe a shadow?\" to \"There's a 93.7% chance this is an early-stage tumour, and here's exactly where you should look.\" It's like going from a flip phone to the latest smartphone – same basic concept, but infinitely more sophisticated.In drug discovery, we used to test medicines through endless trial and error. Now, AI can simulate how millions of compounds might interact with diseases, narrowing down potential treatments from years to months. It's like having a million scientists working 24/7, without needing coffee breaks! My family and I have also revolutionised personalised medicine. Remember when everyone got the same treatment for the same condition? That's like giving everyone the same size clothes and expecting them to fit perfectly. Now, we can analyse a patient's genetic makeup, medical history, and lifestyle to tailor treatments specifically for them. Beyond just getting smarter, we're getting more empathetic too. Modern AI can now detect subtle changes in a patient's voice or facial expressions that might indicate mental health concerns. We can analyse patterns in sleep, activity, and vital signs to predict potential health issues before they become serious. ",
  
    "Ah Tamsin, you've hit on something crucial. It's like having a chart-topping song that's stuck in the recording studio – the potential is there, but it's not reaching its audience. The challenge isn't just about the technology; it's about making these tools work in the real world of healthcare. Our healthcare staff are like musicians trying to learn a new instrument while performing live concerts. They are already juggling multiple responsibilities, moving from patient to patient with barely a moment to catch their breath. Adding new AI tools, no matter how helpful, requires time and training they can barely spare. ",
  
    "Because that's what AI should be - like a popular song everyone can sing along to. No PhD in computer science required, no secret handshake needed. It should be as natural as checking your phone or sending a text message.",
  
    "But let me be clear – just like I'm NOT trying to replace the real Taylor Swift, AI isn't here to replace healthcare professionals. We are more like high-tech backup dancers, making the performance better while the human doctors, nurses, administrators remain the stars of the show.  Just like how Taylor's fans are called Swifties, I like to think of all of you as 'AI-fties' - people who understand that AI isn't some scary future; it's a partner in creating better healthcare for everyone.  As we begin this conference, I challenge each of you to think about how we can make AI, like me, more accessible in your own healthcare settings. How can we ensure that AI truly becomes for All and use 'AI for Change'?  So that's all about me today. But don’t worry – you wont see the last of me just yet because I will be back tomorrow at one of the sessions. So if you want to see more of me? Remember to come back to CHI INNOVATE Day 2 tomorrow   Now, let me hand the time back to my human counterpart and newfound friend: Ms Tamsin Greuclich Smith, Director of the School of X from DesignSingapore Council. "
  ];
  

// --- CORE FUNCTION TO STREAM AUDIO ---
const playScriptLine = async (text, voiceId) => {
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'xi-api-key': YOUR_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        output_format: 'mp3_44100_128'
      })
    });

    const chunks = [];
    const reader = response.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const audioBlob = new Blob(chunks);
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    return new Promise((resolve) => {
      audio.onended = resolve;
      audio.play();
    });
  } catch (error) {
    console.error('Error playing audio:', error);
  }
};



// --- WAIT FOR USER CONTINUE BUTTON ---
const waitForUserClick = () => {
  return new Promise((resolve) => {
    const btn = document.getElementById('continueBtn');
    btn.style.display = 'inline-block';
    btn.disabled = false;

    const handler = () => {
      btn.disabled = true;
      btn.style.display = 'none';
      btn.removeEventListener('click', handler);
      resolve();
    };

    btn.addEventListener('click', handler);
  });
};

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
  





// --- CHANGE AVATAR (MINIMAL MOCK) ---
function changeAvatar(name) {
    currentDebaterIndex = debaterRotation.indexOf('taylor');
    currentDebater = 'taylor';
    document.getElementById('animatedAvatar').innerHTML =
      createCelebrityAvatar(currentDebater);
}

// --- SCRIPT HANDLER ---
async function startScriptedAI() {
  // Step 1: Change avatar
  changeAvatar("T'AI'lor Swift");
  await startMicMonitoring();

  // Step 2: Initial greeting
  await playScriptLine("Good morning everyone, welcome to our AI Eras Tour!", YOUR_VOICE_ID);

  // Step 3: Wait for user input to proceed
//   await waitForUserClick();
await waitForUserToStopSpeaking();


  // Step 4: Go through scripted lines
  for (let line of aiLines) {
    await playScriptLine(line, YOUR_VOICE_ID);
    await waitForUserToStopSpeaking();
    // await waitForUserClick();
  }

  alert("🎤 Script complete. Thank you!");
}

// --- SETUP BUTTON ---
document.getElementById('startScriptedAI').addEventListener('click', startScriptedAI);

