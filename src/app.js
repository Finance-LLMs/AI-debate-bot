// --- src/app.js ---
// Modified to use a single debate agent instead of multiple agents
import { Conversation } from '@elevenlabs/client';

let conversation = null;
let mouthAnimationInterval = null;
let currentMouthState = 'M130,170 Q150,175 170,170'; // closed mouth

// Flag to track if we're in the middle of switching agents
let isSwitchingAgent = false;

// Track the current debater and define the rotation order
// The rotation order is: 1. Nelson Mandela, 2. Taylor Swift, 3. Barbarella
let currentDebaterIndex = 0; // Start with the first debater (Nelson)
const debaterRotation = ['nelson', 'taylor', 'barbarella']; // Updated rotation order
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

async function getSignedUrl(agent = 'nelson') {
    try {
        // Fetch using the specified agent
        const url = `/api/signed-url?agent=${agent}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to get signed URL');
        const data = await response.json();
        return data.signedUrl;
    } catch (error) {
        console.error('Error getting signed URL:', error);
        throw error;
    }
}

async function getAgentId(agent = 'nelson') {
    const response = await fetch(`/api/getAgentId?agent=${agent}`);
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
    const endButton = document.getElementById('endButton');
    
    // Get reference to the next debater button
    const switchToNextDebaterButton = document.getElementById('switchToNextDebater');
    
    // More robust mode checking - handles both objects with mode property and simple strings
    // This should help with inconsistencies between different agents
    const isSpeaking = typeof mode === 'object' 
        ? (mode.mode === 'speaking' || mode.status === 'speaking')  // Check both possible properties
        : mode === 'speaking';                                     // Handle direct string
    
    statusElement.textContent = isSpeaking ? 'Agent Speaking' : 'Agent Silent';
    statusElement.classList.toggle('speaking', isSpeaking);
    
    console.log('Speaking status updated:', { 
        isSpeaking, 
        currentDebater, 
        isSwitchingAgent,
        mode: JSON.stringify(mode), // Log the full mode object to debug
        switchButtonVisible: switchToNextDebaterButton?.style.display === 'flex'
    });
    
    // Skip button state changes if we're in the middle of switching agents
    if (isSwitchingAgent) {
        console.log('SPEAKING: Skipping button state updates during agent switch');
        return;
    }
    
    // Animate avatar based on speaking state
    if (isSpeaking) {
        startMouthAnimation();
        
        // Force disable all action buttons when agent is speaking
        if (summaryButton) {
            console.log('SPEAKING: Disabling summary button');
            summaryButton.disabled = true;
        }
        
        if (switchToNextDebaterButton) {
            console.log('SPEAKING: Disabling next debater button');
            switchToNextDebaterButton.disabled = true;
        }
        
        // End button should remain enabled
    } else {
        stopMouthAnimation();
        
        // Only enable summary button when:
        // 1. Agent is done speaking
        // 2. Button should be visible
        // 3. We're not in the middle of a summary request
        if (summaryButton && summaryButton.style.display === 'flex' && !summarizeRequested) {
            console.log('SPEAKING: Re-enabling summary button');
            summaryButton.disabled = false;
        }
        
        // Re-enable the next debater button when agent stops speaking (as long as it's visible)
        if (switchToNextDebaterButton && switchToNextDebaterButton.style.display === 'flex' && !isSwitchingAgent) {
            console.log('SPEAKING: Re-enabling next debater button');
            switchToNextDebaterButton.disabled = false;
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
}

// Add a monitoring function for Taylor Swift to ensure buttons stay disabled
let taylorButtonMonitorInterval = null;

function ensureTaylorButtonState() {
    // Only run this function if Taylor is the current agent
    if (currentDebater !== 'taylor') {
        if (taylorButtonMonitorInterval) {
            clearInterval(taylorButtonMonitorInterval);
            taylorButtonMonitorInterval = null;
        }
        return;
    }
    
    console.log('TAYLOR MONITOR: Checking button states for Taylor Swift');
    
    // Get references to the buttons
    const summaryButton = document.getElementById('summaryButton');
    const switchToNextDebaterButton = document.getElementById('switchToNextDebater');
    
    // If we're in speaking mode and buttons aren't disabled, fix them
    const speakingStatus = document.getElementById('speakingStatus');
    const isCurrentlySpeaking = speakingStatus && speakingStatus.classList.contains('speaking');
    
    if (isCurrentlySpeaking) {
        console.log('TAYLOR MONITOR: Taylor is currently speaking, ensuring buttons are disabled');
        
        if (summaryButton && !summaryButton.disabled) {
            console.log('TAYLOR MONITOR: Re-disabling summary button');
            summaryButton.disabled = true;
        }
        
        if (switchToNextDebaterButton && !switchToNextDebaterButton.disabled) {
            console.log('TAYLOR MONITOR: Re-disabling next debater button');
            switchToNextDebaterButton.disabled = true;
        }
    }
}

// Initialize the Taylor button monitor interval when Taylor is the current debater
if (currentDebater === 'taylor') {
    taylorButtonMonitorInterval = setInterval(ensureTaylorButtonState, 500); // Check every 500ms
}