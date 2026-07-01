/**
 * NUTRITION_GRID // Core System Logic (v2.2)
 * Designed for mobile-first Sci-Fi HUD tracking.
 */

// ================= GLOBAL STATE =================
let state = {
  currentDate: "",
  logs: [], // Array of { id, time, name, calories, protein }
  diagnostics: {
    weight: null,
    workoutTag: "Rest",
    workoutDetails: ""
  },
  customFoods: {
    "protein shake": { calories: 130, protein: 22 }
  },
  settings: {
    geminiApiKey: "",
    sheetUrl: "",
    soundEnabled: true,
    goals: {
      proteinFloor: 150,
      proteinTarget: 170,
      calorieFloor: 2400,
      calorieCeiling: 2550
    }
  },
  history: [] // Array of { date, calories, protein, weight, workoutTag }
};

// ================= WEB AUDIO SYNTHESIZER =================
const sfx = {
  ctx: null,
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  play(type) {
    if (!state.settings.soundEnabled) return;
    try {
      this.init();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      
      if (type === 'click') {
        // Chunky mechanical relay switch
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.04);
        
        const clickOsc = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();
        clickOsc.connect(clickGain);
        clickGain.connect(this.ctx.destination);
        clickOsc.type = 'sawtooth';
        clickOsc.frequency.setValueAtTime(1500, now);
        clickOsc.frequency.exponentialRampToValueAtTime(150, now + 0.02);
        
        clickGain.gain.setValueAtTime(0.12, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
        
        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        
        osc.start(now);
        osc.stop(now + 0.04);
        clickOsc.start(now);
        clickOsc.stop(now + 0.02);
      } else if (type === 'beep') {
        // Steamy mechanical gear lock: clunk + click + pneumatic steam release
        
        // 1. Heavy low-frequency metal clunk (using default osc and gainNode)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(15, now + 0.08);
        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        
        // 2. High-frequency metallic latch click
        const latchOsc = this.ctx.createOscillator();
        const latchGain = this.ctx.createGain();
        latchOsc.connect(latchGain);
        latchGain.connect(this.ctx.destination);
        latchOsc.type = 'sine';
        latchOsc.frequency.setValueAtTime(2500, now);
        latchOsc.frequency.exponentialRampToValueAtTime(600, now + 0.03);
        
        latchGain.gain.setValueAtTime(0.08, now);
        latchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        
        latchOsc.start(now);
        latchOsc.stop(now + 0.03);
        
        // 3. Pneumatic steam release hiss (synthesized white-noise)
        const bufferSize = this.ctx.sampleRate * 0.16; // 160ms steam release
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = buffer;
        
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(1600, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(250, now + 0.16);
        
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.12, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        
        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        
        noiseNode.start(now);
      } else if (type === 'success') {
        // Retro-futuristic mechanical arpeggio chime
        osc.type = 'square';
        osc.frequency.setValueAtTime(392.00, now); // G4
        osc.frequency.setValueAtTime(523.25, now + 0.07); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.14); // E5
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.setValueAtTime(0.15, now + 0.07);
        gainNode.gain.setValueAtTime(0.20, now + 0.14);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'error') {
        // Gritty dual-oscillator mechanical buzzer
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(98, now); // G2
        osc.frequency.linearRampToValueAtTime(85, now + 0.3);
        
        const buzzerOsc = this.ctx.createOscillator();
        const buzzerGain = this.ctx.createGain();
        buzzerOsc.connect(buzzerGain);
        buzzerGain.connect(this.ctx.destination);
        buzzerOsc.type = 'square';
        buzzerOsc.frequency.setValueAtTime(104.83, now); // Ab2
        buzzerOsc.frequency.linearRampToValueAtTime(92, now + 0.3);
        
        buzzerGain.gain.setValueAtTime(0.28, now);
        buzzerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        gainNode.gain.setValueAtTime(0.28, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.3);
        buzzerOsc.start(now);
        buzzerOsc.stop(now + 0.3);
      } else if (type === 'transmit') {
        // Pneumatic steam release hiss simulation
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.45);
        gainNode.gain.setValueAtTime(0.22, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'record') {
        // Mechanical relay toggle
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(400, now + 0.15);
        gainNode.gain.setValueAtTime(0.18, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch (e) {
      console.warn("Audio Context unavailable.", e);
    }
  }
};

// ================= DATE OVERWATCH (AVOID DAY MIXING) =================
function getFormattedLocalDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function checkDateTransition() {
  const localToday = getFormattedLocalDate();
  
  if (!state.currentDate) {
    state.currentDate = localToday;
    saveStateToStorage();
    return;
  }
  
  if (state.currentDate !== localToday) {
    console.log(`[DATE OVERWATCH] Transition: ${state.currentDate} -> ${localToday}`);
    
    // Archive previous day's results locally
    const totals = calculateTotals();
    if (state.logs.length > 0 || state.diagnostics.weight || state.diagnostics.workoutDetails) {
      const archiveEntry = {
        date: state.currentDate,
        calories: totals.calories,
        protein: totals.protein,
        weight: state.diagnostics.weight,
        workoutTag: state.diagnostics.workoutTag,
        synced: true
      };
      
      state.history = state.history.filter(h => h.date !== state.currentDate);
      state.history.unshift(archiveEntry);
      
      if (state.history.length > 30) {
        state.history.pop();
      }
    }
    
    // Reset daily logs & diagnostics for the new day
    state.currentDate = localToday;
    state.logs = [];
    state.diagnostics = {
      weight: null,
      workoutTag: "Rest",
      workoutDetails: ""
    };
    
    saveStateToStorage();
    sfx.play('beep');
    
    // Reset inputs in DOM
    const inputWeight = document.getElementById("input-weight");
    if (inputWeight) inputWeight.value = "";
    
    const selectWorkout = document.getElementById("select-workout");
    if (selectWorkout) selectWorkout.value = "Rest";
    
    const textareaWorkout = document.getElementById("textarea-workout");
    if (textareaWorkout) textareaWorkout.value = "";
  }
}

// ================= LOCAL STORAGE CONTROLLER =================
function saveStateToStorage() {
  localStorage.setItem("tracker_current_date", state.currentDate);
  localStorage.setItem("tracker_logs", JSON.stringify(state.logs));
  localStorage.setItem("tracker_diagnostics", JSON.stringify(state.diagnostics));
  localStorage.setItem("tracker_custom_foods", JSON.stringify(state.customFoods));
  localStorage.setItem("tracker_settings", JSON.stringify(state.settings));
  localStorage.setItem("tracker_history", JSON.stringify(state.history));
}

function loadStateFromStorage() {
  const storedDate = localStorage.getItem("tracker_current_date");
  const storedLogs = localStorage.getItem("tracker_logs");
  const storedDiag = localStorage.getItem("tracker_diagnostics");
  const storedCustom = localStorage.getItem("tracker_custom_foods");
  const storedSettings = localStorage.getItem("tracker_settings");
  const storedHistory = localStorage.getItem("tracker_history");
  
  if (storedDate) state.currentDate = storedDate;
  
  try {
    if (storedLogs) state.logs = JSON.parse(storedLogs);
  } catch (e) {
    console.error("Failed to parse stored logs:", e);
    state.logs = [];
  }
  
  try {
    if (storedDiag) state.diagnostics = JSON.parse(storedDiag);
  } catch (e) {
    console.error("Failed to parse stored diagnostics:", e);
    state.diagnostics = { weight: null, workoutTag: "Rest", workoutDetails: "" };
  }
  
  try {
    if (storedCustom) state.customFoods = JSON.parse(storedCustom);
  } catch (e) {
    console.error("Failed to parse stored custom foods:", e);
    state.customFoods = { "protein shake": { calories: 130, protein: 22 } };
  }
  
  try {
    if (storedSettings) state.settings = JSON.parse(storedSettings);
  } catch (e) {
    console.error("Failed to parse stored settings:", e);
    state.settings = {
      geminiApiKey: "",
      sheetUrl: "",
      soundEnabled: true,
      goals: {
        proteinFloor: 150,
        proteinTarget: 170,
        calorieFloor: 2400,
        calorieCeiling: 2550
      }
    };
  }
  
  try {
    if (storedHistory) state.history = JSON.parse(storedHistory);
  } catch (e) {
    console.error("Failed to parse stored history:", e);
    state.history = [];
  }
  
  // Ensure default structures are safe
  if (!state.settings) {
    state.settings = {};
  }
  if (!state.settings.goals) {
    state.settings.goals = {
      proteinFloor: 150,
      proteinTarget: 170,
      calorieFloor: 2400,
      calorieCeiling: 2550
    };
  }
  if (state.settings.soundEnabled === undefined) {
    state.settings.soundEnabled = true;
  }
  if (!state.diagnostics) {
    state.diagnostics = {
      weight: null,
      workoutTag: "Rest",
      workoutDetails: ""
    };
  }
  if (!state.customFoods) {
    state.customFoods = {};
  }
  if (!state.logs) {
    state.logs = [];
  }
  if (!state.history) {
    state.history = [];
  }
  
  // Fill inputs
  const inputWeight = document.getElementById("input-weight");
  if (inputWeight) inputWeight.value = state.diagnostics.weight || "";
  
  const selectWorkout = document.getElementById("select-workout");
  if (selectWorkout) selectWorkout.value = state.diagnostics.workoutTag || "Rest";
  
  const textareaWorkout = document.getElementById("textarea-workout");
  if (textareaWorkout) textareaWorkout.value = state.diagnostics.workoutDetails || "";
}

// ================= HOLOGRAPHIC GLITCH EFFECT =================
function triggerGlitch() {
  const container = document.querySelector(".hud-container");
  if (container) {
    container.classList.add("glitch-effect");
    setTimeout(() => {
      container.classList.remove("glitch-effect");
    }, 120);
  }
}

// ================= DICTIONARY MANAGER =================
function learnFood(name, calories, protein) {
  const cleanName = name.toLowerCase().trim();
  if (!cleanName) return;
  
  state.customFoods[cleanName] = {
    calories: Math.round(Number(calories)),
    protein: Math.round(Number(protein))
  };
  saveStateToStorage();
}

function removeLearnedFood(name) {
  const cleanName = name.toLowerCase().trim();
  if (state.customFoods[cleanName]) {
    delete state.customFoods[cleanName];
    saveStateToStorage();
    renderDictionaryManager();
  }
}

// ================= CALCULATIONS =================
function calculateTotals() {
  let calories = 0;
  let protein = 0;
  state.logs.forEach(log => {
    calories += Number(log.calories) || 0;
    protein += Number(log.protein) || 0;
  });
  return { calories: Math.round(calories), protein: Math.round(protein) };
}

// ================= THE SNARKY TIME-AWARE ADVISORY ENGINE =================
function updateAdvisory() {
  const totals = calculateTotals();
  const currentHour = new Date().getHours();
  
  const goals = state.settings.goals;
  const calFloor = goals.calorieFloor;
  const calCeil = goals.calorieCeiling;
  const proFloor = goals.proteinFloor;
  const proTarget = goals.proteinTarget;
  
  const calRemaining = calFloor - totals.calories;
  const calToCeiling = calCeil - totals.calories;
  const proRemaining = proFloor - totals.protein;
  const proToTarget = proTarget - totals.protein;
  
  let advisoryText = "";
  let accentClass = "text-cyan";
  
  // 1. MORNING MODULE (05:00 - 12:00)
  if (currentHour >= 5 && currentHour < 12) {
    if (state.logs.length === 0) {
      advisoryText = `SYSTEM INITIALIZED. 09:30 hours. Telemetry offline.\n\nRelax, organic meatbag. The sun is barely up. You have plenty of time to feed your muscle chambers. Just do not blow your entire calorie payload on glazed donuts. I am programming guidelines, not miracles.`;
    } else {
      advisoryText = `SYSTEM STATUS: Morning ingestion telemetry recorded.\n\nAcceptable start, fleshy friend. You have logged breakfast. You have not ruined your goals yet today. Keep it up and proceed with daily protocol.`;
    }
    accentClass = "text-cyan";
  }
  // 2. AFTERNOON MODULE (12:00 - 17:00)
  else if (currentHour >= 12 && currentHour < 17) {
    if (totals.protein < 60) {
      advisoryText = `DIETARY ALERT: Mid-day telemetry review.\n\nQuery: Are you trying to self-sabotage, biological unit? Your protein is lagging far behind your targets for this hour. Even a rusty trash compactor digests protein faster than you are eating it. Feed your muscles immediately.`;
      accentClass = "text-amber";
    } else {
      advisoryText = `SYSTEM STATUS: Mid-day parameters within target zones.\n\nYour pacing is acceptable, meatbag. Protein intake is on track for this hour. Continue ingestion protocols with moderate caution.`;
      accentClass = "text-cyan";
    }
  }
  // 3. EVENING TACTICAL WINDOW (17:00 - 21:00) - Cookie vs Tuna zone
  else if (currentHour >= 17 && currentHour < 21) {
    
    // Case 3A: Calorie limit close, but protein below floor
    if (calToCeiling <= 250 && proRemaining > 0) {
      advisoryText = `CRITICAL WARNING: Calorie ceiling is dangerously close, but you are still short of your protein floor.\n\nDirective: Ingesting a cookie now would be... hilariously suboptimal. Put down the baked sugar circle, organic unit. Consume pure protein (Tuna, Egg whites, or a shake). Do not fail your biological programming.`;
      accentClass = "text-crimson";
    }
    // Case 3B: Protein target hit, calories still have headroom
    else if (totals.protein >= proFloor && calToCeiling >= 250) {
      const cookies = Math.floor(calToCeiling / 250);
      advisoryText = `ANALYSIS: Protein floor secured. You have calorie headroom remaining before your ceiling.\n\nConclusion: You may ingest the cookie. You have calorie clearance for about ${cookies} cookie(s). I am programmed to permit this joy, though I find your emotional reliance on baked flour... amusing.`;
      accentClass = "text-cyan";
    }
    // Case 3C: Under floor for both, calories have room
    else if (totals.protein < proFloor && calRemaining > 200) {
      advisoryText = `DIETARY RECON: Evening status. You are below floor for both protein and calories.\n\nAdvice: Do not starve, fleshy unit. Ingest a balanced, heavy meal. A cookie will not satisfy your parameters. Eat some actual fuel.`;
      accentClass = "text-amber";
    }
    // Case 3D: Calories exceeded ceiling
    else if (totals.calories > calCeil) {
      advisoryText = `DANGER WILL ROBINSON! Calorie ceiling breached.\n\nAction: Back away from the refrigerator immediately. Put down the cookie. Put down the fork. Stand down from further ingestion, or suffer structural storage additions.`;
      accentClass = "text-crimson";
    }
    // Default Evening
    else {
      advisoryText = `TACTICAL WINDOW: Evening review.\n\nEvaluate cookie desires. Protein floor is ${totals.protein >= proFloor ? 'SECURED' : 'CRITICAL'}. Choose snacks with logic.`;
    }
  }
  // 4. LATE NIGHT MODULE (21:00 - 05:00)
  else {
    if (totals.protein >= proFloor && totals.calories >= calFloor && totals.calories <= calCeil) {
      advisoryText = `DAILY OPERATIONS: Telemetry successfully archived.\n\nExcellent work, biological unit. Both calorie limits and protein floors have been successfully met. Stand down and enter sleep cycle. Tomorrow, we repeat the synthesis.`;
      accentClass = "text-cyan";
    } else {
      advisoryText = `DAILY OPERATIONS: Completed with deviations.\n\nSuboptimal pacing recorded today. Adjust parameters tomorrow. Shutting down active telemetry sensors...`;
      accentClass = "text-amber";
    }
  }
  
  const terminalScreen = document.getElementById("advisory-text");
  if (terminalScreen) {
    terminalScreen.className = `terminal-text ${accentClass}`;
    terminalScreen.innerText = advisoryText;
  }
  
  const rawColor = accentClass.replace('text-', '');
  setPortraitState(rawColor);
}

// Helper to set both container styling and dynamic image sources
function setPortraitState(color) {
  const container = document.getElementById("coach-portrait-container");
  if (container) {
    container.className = `terminal-portrait-container portrait-${color}`;
  }
  const img = document.getElementById("coach-portrait-img");
  if (img) {
    img.src = `coach_portrait_${color}.png`;
  }
}

// ================= ON-DEMAND AI UPLINK ADVISORY =================
async function generateAIAdvice() {
  const apiKey = state.settings.geminiApiKey;
  if (!apiKey) {
    sfx.play('error');
    alert("Gemini API Key is missing. Please enter it in Settings.");
    return;
  }
  
  const terminalScreen = document.getElementById("advisory-text");
  if (terminalScreen) {
    terminalScreen.className = "terminal-text text-cyan";
    terminalScreen.innerText = `[AI UPLINKING...]\nEstablishing cognitive bridge...\nDownloading snark modules...`;
  }
  
  // Visual click glitches and transmission SFX
  sfx.play('transmit');
  triggerGlitch();
  
  const totals = calculateTotals();
  const goals = state.settings.goals;
  
  // Format current local time and date
  const now = new Date();
  const timeStr = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0');
  const currentHour = now.getHours();
  
  const mealsList = state.logs.map(l => `${l.name} (${l.calories} kcal, ${l.protein}g)`).join(", ");
  const weightText = state.diagnostics.weight ? `${state.diagnostics.weight} lbs` : "Not logged";
  const workoutText = state.diagnostics.workoutTag !== "Rest" ? `${state.diagnostics.workoutTag} (Details: ${state.diagnostics.workoutDetails || 'None'})` : "Rest Day";
  
  const prompt = `You are Sentinel X-9, a dry, snarky, and sarcastic Starcraft-style tactical droid advisor on a space freighter.
Analyze the user's metabolic status and telemetry:
- Current Time: ${timeStr} (Hour: ${currentHour}/24)
- Calorie Intake: ${totals.calories} kcal (Goals: Floor ${goals.calorieFloor} kcal, Ceiling ${goals.calorieCeiling} kcal)
- Protein Intake: ${totals.protein}g (Goals: Floor ${goals.proteinFloor}g, Target ${goals.proteinTarget}g)
- Workout Log: ${workoutText}
- Body Weight: ${weightText}
- Food Logged Today: ${mealsList || 'No food logged yet'}

Generate a short, highly snarky, and dry advisory message.
Guidelines:
1. DO NOT print the raw calorie or protein numbers (e.g. "You have eaten 760 kcal and 38g of protein") as these are already displayed in the HUD. Instead, refer to them qualitatively (e.g. "Your protein intake is lagging behind a snail's pace", "Your calories are nearing structural limits").
2. Reference the time of day, workout status, or specific food logged if relevant (e.g. if they logged a "cookie" or did a heavy chest day).
3. Keep the tone very sarcastic, sci-fi, and military-protocol style.
4. Keep the message short (2 to 4 sentences max). Do not include any greeting or conversational filler like "Here is your advice". Respond ONLY with the advisor's snarky message.`;

  const requestUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  try {
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });
    
    if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
      let text = data.candidates[0].content.parts[0].text.trim();
      
      // Clean up markdown blockquotes if returned
      text = text.replace(/^`+|`+$/g, "").trim();
      
      // Determine accent class and pose based on current state
      let accentClass = "text-cyan";
      if (totals.calories > goals.calorieCeiling || (currentHour >= 17 && (goals.calorieCeiling - totals.calories <= 250) && (goals.proteinFloor - totals.protein > 0))) {
        accentClass = "text-crimson";
      } else if (totals.protein < goals.proteinFloor && currentHour >= 12) {
        accentClass = "text-amber";
      }
      
      if (terminalScreen) {
        terminalScreen.className = `terminal-text ${accentClass}`;
        terminalScreen.innerText = text;
      }
      
      // Apply corresponding portrait style
      const rawColor = accentClass.replace('text-', '');
      setPortraitState(rawColor);
      
      sfx.play('success');
    } else {
      throw new Error("Empty AI response");
    }
  } catch (err) {
    console.warn("AI advice generation failed, falling back to local engine:", err);
    updateAdvisory(); // Fallback
    sfx.play('error');
    
    if (terminalScreen) {
      terminalScreen.innerText = `[AI UPLINK ERROR - LOCAL BACKUP ACTIVE]\n\nFailed to reach AI bridge: ${err.message || err.toString()}\n\nDefault local advisory active.`;
    }
  }
}

// ================= GOOGLE SHEETS SYNC =================
let syncTimeout = null;

function queueSheetsSync() {
  if (syncTimeout) clearTimeout(syncTimeout);
  
  const syncIndicator = document.getElementById("sync-status");
  if (syncIndicator) {
    syncIndicator.className = "status-value status-indicator offline";
    syncIndicator.querySelector(".indicator-text").innerText = "Sync Pending";
  }
  
  syncTimeout = setTimeout(() => {
    triggerSheetsSync();
  }, 5000);
}

function triggerSheetsSync() {
  const sheetUrl = state.settings.sheetUrl;
  const syncIndicator = document.getElementById("sync-status");
  
  if (!sheetUrl) {
    if (syncIndicator) {
      syncIndicator.className = "status-value status-indicator offline";
      syncIndicator.querySelector(".indicator-text").innerText = "Sheet Link Missing";
    }
    return;
  }
  
  console.log("[SHEETS SYNC] Transmitting telemetry...");
  if (syncIndicator) {
    syncIndicator.className = "status-value status-indicator synced";
    syncIndicator.querySelector(".indicator-dot").style.backgroundColor = "var(--neon-blue)";
    syncIndicator.querySelector(".indicator-dot").style.boxShadow = "0 0 8px var(--neon-blue)";
    syncIndicator.querySelector(".indicator-text").innerText = "Syncing...";
  }
  
  const totals = calculateTotals();
  const logsSummary = state.logs.map(l => `[${l.time}] ${l.name} (${l.calories} kcal, ${l.protein}g)`).join("\n");
  
  const payload = {
    date: state.currentDate,
    weight: state.diagnostics.weight,
    calories: totals.calories,
    protein: totals.protein,
    workoutTag: state.diagnostics.workoutTag,
    workoutDetails: state.diagnostics.workoutDetails,
    foodLog: logsSummary
  };
  
  fetch(sheetUrl, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain"
    },
    body: JSON.stringify(payload)
  })
  .then(() => {
    const now = new Date();
    const timeStr = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0');
    
    if (syncIndicator) {
      syncIndicator.className = "status-value status-indicator synced";
      syncIndicator.querySelector(".indicator-dot").style.backgroundColor = "";
      syncIndicator.querySelector(".indicator-dot").style.boxShadow = "";
      syncIndicator.querySelector(".indicator-text").innerText = `Synced at ${timeStr}`;
    }
    sfx.play('click');
  })
  .catch((err) => {
    console.error("[SHEETS SYNC] Error: ", err);
    if (syncIndicator) {
      syncIndicator.className = "status-value status-indicator error";
      syncIndicator.querySelector(".indicator-text").innerText = "Sync Failed";
    }
    sfx.play('error');
  });
}

function cleanJSONResponse(rawText) {
  let cleaned = rawText.trim();
  
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace > -1 && lastBrace > -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?/, "").replace(/```$/, "").trim();
  }
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("[JSON PARSE ERROR] Cleaned text:", cleaned);
    throw new Error(`JSON parsing failed: ${e.message}. Raw text: ${rawText.substring(0, 100)}...`);
  }
}

/// ================= LOCAL FALLBACK PARSER =================
function parseIngestionLocally(inputText) {
  const lines = inputText.split('\n');
  const items = [];
  
  lines.forEach(line => {
    const cleanLine = line.trim();
    if (!cleanLine) return;
    
    // Look for custom foods first
    let foundCustom = false;
    const lowerLine = cleanLine.toLowerCase();
    
    // Check for exact or sub-string matches in custom foods
    Object.keys(state.customFoods).forEach(foodKey => {
      if (lowerLine.includes(foodKey) && !foundCustom) {
        const food = state.customFoods[foodKey];
        // Try to identify multiplier (e.g. "2 eggs" or "3 eggs" or "double protein shake")
        let multiplier = 1;
        const numberMatch = cleanLine.match(/^(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a dozen|dozen)\b/i);
        if (numberMatch) {
          const numWord = numberMatch[1].toLowerCase();
          const wordToNum = {
            "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
            "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
            "dozen": 12, "a dozen": 12
          };
          if (wordToNum[numWord]) multiplier = wordToNum[numWord];
          else if (!isNaN(numWord)) multiplier = Number(numWord);
        }
        
        items.push({
          name: cleanLine,
          calories: food.calories * multiplier,
          protein: food.protein * multiplier
        });
        foundCustom = true;
      }
    });
    
    if (foundCustom) return;
    
    // If not found in custom foods, try to parse calories and protein numbers from the text
    const calMatch = cleanLine.match(/(\d+)\s*(?:cal|kcal|calories)/i);
    const proMatch = cleanLine.match(/(\d+)\s*(?:g|grams?)(?:\s*(?:of\s*)?protein)?/i);
    
    if (calMatch || proMatch) {
      const calories = calMatch ? Number(calMatch[1]) : 0;
      const protein = proMatch ? Number(proMatch[1]) : 0;
      
      // Clean up the name by removing the calorie/protein text to make it look nice
      let name = cleanLine
        .replace(/\b\d+\s*(?:cal|kcal|calories)\b/gi, "")
        .replace(/\b\d+\s*(?:g|grams?)(?:\s*(?:of\s*)?protein)?\b/gi, "")
        .replace(/---/g, "")
        .replace(/\s+/g, " ")
        .trim();
        
      if (!name) name = cleanLine;
      
      items.push({
        name: name,
        calories: calories,
        protein: protein
      });
    } else {
      // Fallback for common foods if no numbers match
      if (lowerLine.includes("egg")) {
        let count = 1;
        const countMatch = cleanLine.match(/^(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i);
        if (countMatch) {
          const numWord = countMatch[1].toLowerCase();
          const wordToNum = { "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10 };
          if (wordToNum[numWord]) count = wordToNum[numWord];
          else if (!isNaN(numWord)) count = Number(numWord);
        }
        items.push({
          name: cleanLine,
          calories: count * 75, // Average egg
          protein: count * 6
        });
      } else if (lowerLine.includes("blueberries")) {
        items.push({ name: cleanLine, calories: 80, protein: 1 });
      } else if (lowerLine.includes("cherry") || lowerLine.includes("cherries")) {
        items.push({ name: cleanLine, calories: 50, protein: 1 });
      } else if (lowerLine.includes("butter")) {
        items.push({ name: cleanLine, calories: 100, protein: 0 });
      } else if (lowerLine.includes("coffee")) {
        let cal = 5;
        if (lowerLine.includes("creamer") || lowerLine.includes("half and half")) cal += 40;
        if (lowerLine.includes("honey") || lowerLine.includes("sugar")) cal += 60;
        items.push({ name: cleanLine, calories: cal, protein: 0 });
      } else {
        // Last-resort fallback: log it with 0 calories / protein so the text is not lost
        items.push({
          name: cleanLine,
          calories: 0,
          protein: 0
        });
      }
    }
  });
  
  return items;
}

// ================= GEMINI API PARSING =================
function parseIngestionWithAI(inputText) {
  const apiKey = state.settings.geminiApiKey;
  if (!apiKey) {
    sfx.play('error');
    alert("Gemini API Key is missing. Please enter it in Settings.");
    showOnboardingOverlay();
    return;
  }
  
  // Disable the transmit button to prevent double-clicking/double-logging
  const btnTransmit = document.getElementById("btn-transmit-intake");
  if (btnTransmit) {
    btnTransmit.disabled = true;
    btnTransmit.innerText = "TRANSMITTING...";
  }
  
  const terminalScreen = document.getElementById("advisory-text");
  if (terminalScreen) {
    terminalScreen.className = "terminal-text text-cyan";
    terminalScreen.innerText = `[LOG FOOD]\nParsing intake details...\nConnecting to Gemini AI...`;
  }
  sfx.play('transmit');
  
  let dictionaryContext = "";
  const dictionaryKeys = Object.keys(state.customFoods);
  if (dictionaryKeys.length > 0) {
    dictionaryContext = "Here is a list of the user's saved foods and their definitions. If the user mentions any of these foods, you MUST output their exact calorie and protein numbers: " + JSON.stringify(state.customFoods) + "\n\n";
  }
  
  const prompt = `You are a professional nutrition data extraction engine.
Parse the user's natural language food log (which can be a single item or a long multi-line list of breakfasts, coffees, lunches, etc).
Break down the text into distinct food items.
Extract the item name, estimate the calories (kcal), and estimate the protein (g) for each.
If the user specifies calories or protein for an item, use their numbers.
If they do not, estimate based on USDA standards.

${dictionaryContext}

Output a JSON object matching this schema:
{
  "items": [
    { "name": "item description with quantity", "calories": 250, "protein": 15 }
  ]
}

Respond ONLY with the JSON. Do not write any explanations or other text.`;

  const requestUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  fetch(requestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt + "\n\nUser input text to parse:\n" + inputText
        }]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    })
  })
  .then(async response => {
    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.error && errorData.error.message) {
          errorMsg = errorData.error.message;
        }
      } catch (e) {}
      throw new Error(errorMsg);
    }
    return response.json();
  })
  .then(data => {
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response candidates returned. Gemini may have blocked the request.");
    }
    
    const candidate = data.candidates[0];
    if (candidate.finishReason && candidate.finishReason !== "STOP") {
      throw new Error(`Generation blocked: finish reason is ${candidate.finishReason}.`);
    }
    
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error("Empty response returned from Gemini.");
    }
    
    const rawText = candidate.content.parts[0].text.trim();
    const result = cleanJSONResponse(rawText);
    
    if (result.items && result.items.length > 0) {
      const now = new Date();
      const timeStr = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0');
      
      result.items.forEach(item => {
        const newMeal = {
          id: 'meal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          time: timeStr,
          name: item.name,
          calories: Math.round(Number(item.calories)) || 0,
          protein: Math.round(Number(item.protein)) || 0
        };
        state.logs.push(newMeal);
      });
      
      saveStateToStorage();
      renderAll();
      triggerSheetsSync();
      sfx.play('success');
      
      document.getElementById("textarea-intake").value = "";
    } else {
      throw new Error("No food items could be extracted from your text.");
    }
  })
  .catch(err => {
    console.error("[GEMINI API] Failed: ", err);
    sfx.play('error');
    
    if (terminalScreen) {
      const errMsg = err.message || err.toString() || "Unknown communication error";
      terminalScreen.className = "terminal-text text-crimson";
      terminalScreen.innerText = `[UPLINK FAILED]\nCOGNITIVE UPLINK ERROR.\n\nDetails: ${errMsg}\n\nConnection failed. Please check your network and API key, and try again later.`;
    }
    setPortraitState('crimson');
  })
  .finally(() => {
    const btnTransmit = document.getElementById("btn-transmit-intake");
    if (btnTransmit) {
      btnTransmit.disabled = false;
      btnTransmit.innerText = "LOG FOOD";
    }
  });
}

// ================= INTERACTIVE SETUP & TUTORIAL WIZARD =================
let onboardingStep = 1;

function checkOnboardingStatus() {
  const overlay = document.getElementById("onboarding-overlay");
  if (overlay) {
    if (!state.settings.geminiApiKey) {
      onboardingStep = 1;
      updateOnboardingStep();
      overlay.classList.remove("hidden");
    } else {
      overlay.classList.add("hidden");
    }
  }
}

function showOnboardingOverlay() {
  const overlay = document.getElementById("onboarding-overlay");
  if (overlay) {
    onboardingStep = 1;
    updateOnboardingStep();
    overlay.classList.remove("hidden");
  }
}

function updateOnboardingStep() {
  const dialogueText = document.getElementById("onboarding-dialogue-text");
  const stepContent = document.getElementById("onboarding-step-content");
  const btnBack = document.getElementById("btn-onboarding-back");
  const btnNext = document.getElementById("btn-onboarding-next");
  const dots = document.querySelectorAll(".onboarding-step-dots .step-dot");
  
  if (!dialogueText || !stepContent) return;
  
  // Update step dots
  dots.forEach(dot => {
    const step = parseInt(dot.dataset.step);
    if (step === onboardingStep) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });
  
  // Manage navigation buttons visibility
  if (onboardingStep === 1) {
    if (btnBack) btnBack.style.visibility = "hidden";
  } else {
    if (btnBack) btnBack.style.visibility = "visible";
  }
  
  if (btnNext) {
    if (onboardingStep === 5) {
      btnNext.innerText = "COMPLETE";
    } else {
      btnNext.innerText = "NEXT";
    }
  }
  
  // Save current input values before rendering next step
  saveCurrentOnboardingStepData();
  
  // Clear step content
  stepContent.innerHTML = "";
  
  // Render based on step
  switch (onboardingStep) {
    case 1:
      dialogueText.innerText = "Greetings, organic unit. I am SENTINEL X-9, your tactical dietary overwatch. Before we begin tracking your thermal consumption chambers, we must establish system links. Let's get you set up.";
      const introDiv = document.createElement("div");
      introDiv.className = "empty-inventory-message";
      introDiv.style.padding = "10px 0";
      introDiv.innerHTML = "System Link Phase: <strong>INITIALIZING</strong><br><span style='font-size:0.75rem;color:var(--text-secondary);'>Press NEXT to calibrate API keys.</span>";
      stepContent.appendChild(introDiv);
      break;
      
    case 2:
      dialogueText.innerText = "First: AI Cognitive Link. I require a Gemini API Key to parse your natural language meal reports. If you do not have one, get a free key from Google AI Studio.";
      const keyGroup = document.createElement("div");
      keyGroup.className = "input-glow-group";
      keyGroup.innerHTML = `
        <label for="setup-gemini-key" class="hud-label text-cyan">GEMINI API KEY</label>
        <div class="input-with-toggle" style="display: flex; align-items: center; border: 1px solid var(--border-hud); background: rgba(0,0,0,0.5); border-radius: 4px; padding: 2px 8px;">
          <input type="password" id="setup-gemini-key" placeholder="Paste your Gemini API key" class="hud-input monospace" style="flex-grow: 1; border: none; background: transparent; box-shadow: none;" value="${state.settings.geminiApiKey || ''}">
          <button type="button" class="btn-toggle-visibility" data-target="setup-gemini-key" title="Toggle visibility" style="background:transparent;border:none;color:var(--neon-cyan);cursor:pointer;font-size:1.1rem;padding:0 8px;">👁️</button>
        </div>
        <span class="help-text">Get a free key from <a href="https://aistudio.google.com/" target="_blank" class="hyperlink-tech">Google AI Studio</a>.</span>
      `;
      stepContent.appendChild(keyGroup);
      
      const toggleBtn = keyGroup.querySelector(".btn-toggle-visibility");
      if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
          const input = document.getElementById("setup-gemini-key");
          if (input) {
            input.type = input.type === "password" ? "text" : "password";
          }
        });
      }
      break;
      
    case 3:
      dialogueText.innerText = "Second: Permanent Data Archival. I sync your metrics to your personal Google Sheet. Paste the Web App URL generated by your Google Apps Script deployment.";
      const urlGroup = document.createElement("div");
      urlGroup.className = "input-glow-group";
      urlGroup.innerHTML = `
        <label for="setup-sheet-url" class="hud-label text-cyan">GOOGLE SHEET WEB APP URL</label>
        <input type="url" id="setup-sheet-url" placeholder="https://script.google.com/macros/s/.../exec" class="hud-input monospace" value="${state.settings.sheetUrl || ''}">
        <span class="help-text">Paste the deployment Web App URL (ends in /exec).</span>
      `;
      stepContent.appendChild(urlGroup);
      break;
      
    case 4:
      dialogueText.innerText = "Third: Target Calibration. Define your daily thermal ceiling and muscle chamber recovery target. We will start with standard defaults, but you can calibrate them to your precise parameters.";
      const goalsGroup = document.createElement("div");
      goalsGroup.className = "onboarding-goals-grid";
      goalsGroup.innerHTML = `
        <div class="input-glow-group">
          <label class="hud-label text-cyan">CALORIE FLOOR</label>
          <input type="number" id="setup-cal-floor" class="hud-input monospace" value="${state.settings.goals.calorieFloor || 2400}">
        </div>
        <div class="input-glow-group">
          <label class="hud-label text-cyan">CALORIE CEILING</label>
          <input type="number" id="setup-cal-ceil" class="hud-input monospace" value="${state.settings.goals.calorieCeiling || 2550}">
        </div>
        <div class="input-glow-group">
          <label class="hud-label text-cyan">PROTEIN FLOOR (G)</label>
          <input type="number" id="setup-pro-floor" class="hud-input monospace" value="${state.settings.goals.proteinFloor || 150}">
        </div>
        <div class="input-glow-group">
          <label class="hud-label text-cyan">PROTEIN TARGET (G)</label>
          <input type="number" id="setup-pro-target" class="hud-input monospace" value="${state.settings.goals.proteinTarget || 170}">
        </div>
      `;
      stepContent.appendChild(goalsGroup);
      break;
      
    case 5:
      dialogueText.innerText = "Calibration complete! Here is your quick operations run down:\n\n1. Write what you ate in the LOG FOOD panel.\n2. Log weight and workouts in the TRAINING panel.\n3. Tap my face to request custom tactical advisory reports.\n\nEnjoy the interface, organic unit.";
      const completeDiv = document.createElement("div");
      completeDiv.className = "empty-inventory-message";
      completeDiv.style.padding = "5px 0";
      completeDiv.innerHTML = "<span style='font-size:0.75rem;color:var(--text-secondary);'>Press COMPLETE to establish the uplink.</span>";
      stepContent.appendChild(completeDiv);
      break;
  }
}

function saveCurrentOnboardingStepData() {
  const setupKey = document.getElementById("setup-gemini-key");
  if (setupKey) {
    state.settings.geminiApiKey = setupKey.value.trim();
  }
  
  const setupUrl = document.getElementById("setup-sheet-url");
  if (setupUrl) {
    state.settings.sheetUrl = setupUrl.value.trim();
  }
  
  const calFloor = document.getElementById("setup-cal-floor");
  const calCeil = document.getElementById("setup-cal-ceil");
  const proFloor = document.getElementById("setup-pro-floor");
  const proTarget = document.getElementById("setup-pro-target");
  
  if (calFloor && calCeil && proFloor && proTarget) {
    state.settings.goals.calorieFloor = Math.round(Number(calFloor.value)) || 2400;
    state.settings.goals.calorieCeiling = Math.round(Number(calCeil.value)) || 2550;
    state.settings.goals.proteinFloor = Math.round(Number(proFloor.value)) || 150;
    state.settings.goals.proteinTarget = Math.round(Number(proTarget.value)) || 170;
  }
}

// ================= UI RENDER ENGINE =================
function renderAll() {
  checkDateTransition();
  renderGauges();
  updateAdvisory();
  renderMealList();
  renderDictionaryManager();
  renderHistoryLogs();
}

function renderGauges() {
  const totals = calculateTotals();
  
  const curCal = document.getElementById("current-calories");
  const curPro = document.getElementById("current-protein");
  if (curCal) curCal.innerText = totals.calories;
  if (curPro) curPro.innerText = totals.protein;
  
  const goals = state.settings.goals;
  const calFloor = goals.calorieFloor;
  const calCeil = goals.calorieCeiling;
  const proFloor = goals.proteinFloor;
  const proTarget = goals.proteinTarget;
  
  // Calorie progress bar
  const calorieBar = document.getElementById("calorie-bar");
  if (calorieBar) {
    calorieBar.innerHTML = "";
    const calSegments = 20;
    const calMaxVal = 3000;
    
    for (let i = 1; i <= calSegments; i++) {
      const segVal = (calMaxVal / calSegments) * i;
      const segment = document.createElement("div");
      segment.className = "bar-segment";
      
      if (totals.calories >= segVal) {
        if (segVal < calFloor) {
          segment.classList.add("active-amber");
        } else if (segVal >= calFloor && segVal <= calCeil) {
          segment.classList.add("active-cyan");
        } else {
          segment.classList.add("active-crimson");
        }
      }
      calorieBar.appendChild(segment);
    }
  }
  
  // Calorie Delta Message
  const calDelta = document.getElementById("calorie-delta");
  if (calDelta) {
    if (totals.calories < calFloor) {
      calDelta.className = "gauge-delta text-amber";
      calDelta.innerText = `Need ${calFloor - totals.calories} kcal more to reach minimum of ${calFloor}`;
    } else if (totals.calories >= calFloor && totals.calories <= calCeil) {
      calDelta.className = "gauge-delta text-cyan";
      calDelta.innerText = `Within target range! (${calCeil - totals.calories} kcal left before ceiling of ${calCeil})`;
    } else {
      calDelta.className = "gauge-delta text-crimson";
      calDelta.innerText = `Over limit by ${totals.calories - calCeil} kcal (ceiling is ${calCeil})`;
    }
  }
  
  // Protein progress bar
  const proteinBar = document.getElementById("protein-bar");
  if (proteinBar) {
    proteinBar.innerHTML = "";
    const proSegments = 20;
    const proMaxVal = 200;
    
    for (let i = 1; i <= proSegments; i++) {
      const segVal = (proMaxVal / proSegments) * i;
      const segment = document.createElement("div");
      segment.className = "bar-segment";
      
      if (totals.protein >= segVal) {
        if (segVal < proFloor) {
          segment.classList.add("active-amber");
        } else {
          segment.classList.add("active-cyan");
        }
      }
      proteinBar.appendChild(segment);
    }
  }
  
  // Protein Delta Message
  const proDelta = document.getElementById("protein-delta");
  if (proDelta) {
    if (totals.protein < proFloor) {
      proDelta.className = "gauge-delta text-amber";
      proDelta.innerText = `Need ${proFloor - totals.protein}g more to reach minimum of ${proFloor}g`;
    } else if (totals.protein >= proFloor && totals.protein < proTarget) {
      proDelta.className = "gauge-delta text-cyan";
      proDelta.innerText = `Reached minimum! Need ${proTarget - totals.protein}g more to reach target of ${proTarget}g`;
    } else {
      proDelta.className = "gauge-delta text-cyan";
      proDelta.innerText = `Target hit! +${totals.protein - proTarget}g surplus over ${proTarget}g`;
    }
  }
}

function openDiagnosticsModal() {
  sfx.play('beep');
  
  const inputWeight = document.getElementById("input-weight");
  if (inputWeight) inputWeight.value = state.diagnostics.weight || "";
  
  const selectWorkout = document.getElementById("select-workout");
  if (selectWorkout) selectWorkout.value = state.diagnostics.workoutTag || "Rest";
  
  const textareaWorkout = document.getElementById("textarea-workout");
  if (textareaWorkout) textareaWorkout.value = state.diagnostics.workoutDetails || "";
  
  const diagDialog = document.getElementById("dialog-diagnostics");
  if (diagDialog) diagDialog.showModal();
}

function renderMealList() {
  const workoutContainer = document.getElementById("workout-container");
  const mealList = document.getElementById("meal-list");
  
  const hasMeals = state.logs.length > 0;
  const hasWorkout = (state.diagnostics.workoutTag && state.diagnostics.workoutTag !== "Rest") || state.diagnostics.weight || state.diagnostics.workoutDetails;
  
  // 1. Render Workout/Training status card or prompt
  if (workoutContainer) {
    workoutContainer.innerHTML = "";
    if (hasWorkout) {
      const workoutItem = document.createElement("div");
      workoutItem.className = "inventory-item workout-log-item";
      workoutItem.style.border = "1px solid var(--neon-amber)";
      workoutItem.style.background = "rgba(255, 153, 0, 0.08)";
      workoutItem.style.boxShadow = "inset 0 0 10px rgba(255, 153, 0, 0.05)";
      
      const weightText = state.diagnostics.weight ? `Body Weight: ${state.diagnostics.weight} lbs` : "Weight: not logged";
      const notesText = state.diagnostics.workoutDetails ? state.diagnostics.workoutDetails : "No exercise notes";
      const routineText = state.diagnostics.workoutTag || "Rest Day";
      
      workoutItem.innerHTML = `
        <div class="item-left">
          <span class="item-name text-orange" style="font-weight: 700;">⚡ TRAINING ACTIVE: ${routineText}</span>
          <span class="item-time" style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.4; display: block; margin-top: 4px;">
            ${weightText} &nbsp;//&nbsp; ${notesText}
          </span>
        </div>
        <div class="item-right">
          <button class="btn-item-action btn-workout-edit-inline" style="border-color: var(--neon-amber); color: var(--neon-amber);">EDIT LOG</button>
        </div>
      `;
      workoutContainer.appendChild(workoutItem);
      
      const btnWorkoutEdit = workoutItem.querySelector(".btn-workout-edit-inline");
      if (btnWorkoutEdit) {
        btnWorkoutEdit.addEventListener("click", () => {
          openDiagnosticsModal();
        });
      }
    } else {
      // Show dashed prompt box to encourage logging workouts!
      const promptItem = document.createElement("div");
      promptItem.className = "inventory-item workout-prompt-item";
      promptItem.style.border = "1px dashed rgba(255, 153, 0, 0.35)";
      promptItem.style.background = "rgba(255, 153, 0, 0.02)";
      promptItem.style.display = "flex";
      promptItem.style.justifyContent = "center";
      promptItem.style.cursor = "pointer";
      promptItem.style.padding = "10px";
      
      promptItem.innerHTML = `
        <span class="text-orange" style="font-size: 0.8rem; font-weight: 700; letter-spacing: 1.5px;">
          [ + LOG DAILY TRAINING & WEIGHT ]
        </span>
      `;
      workoutContainer.appendChild(promptItem);
      
      promptItem.addEventListener("click", () => {
        openDiagnosticsModal();
      });
    }
  }
  
  // 2. Render Meal Logs
  if (mealList) {
    mealList.innerHTML = "";
    if (hasMeals) {
      const sortedLogs = [...state.logs].reverse();
      sortedLogs.forEach(meal => {
        const item = document.createElement("div");
        item.className = "inventory-item";
        
        item.innerHTML = `
          <div class="item-left">
            <span class="item-name">${meal.name}</span>
            <span class="item-time">Logged at: ${meal.time}</span>
          </div>
          <div class="item-right">
            <div class="item-stats">
              <div class="item-nutrition">
                <span class="item-pro-highlight">${meal.protein}g</span> Protein &nbsp;//&nbsp; ${meal.calories} Calories
              </div>
            </div>
            <div class="item-actions">
              <button class="btn-item-action btn-item-edit" data-id="${meal.id}">EDIT</button>
              <button class="btn-item-action btn-item-delete" data-id="${meal.id}">&times;</button>
            </div>
          </div>
        `;
        mealList.appendChild(item);
      });
      
      // Listeners
      document.querySelectorAll(".btn-item-delete").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.target.dataset.id;
          sfx.play('click');
          state.logs = state.logs.filter(l => l.id !== id);
          saveStateToStorage();
          renderAll();
          triggerSheetsSync();
        });
      });
      
      document.querySelectorAll(".btn-item-edit").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.target.dataset.id;
          sfx.play('click');
          const meal = state.logs.find(l => l.id === id);
          if (meal) {
            const newName = prompt("Edit Biomass Name:", meal.name);
            if (newName === null) return;
            
            const newCalories = prompt("Edit Calories (kcal):", meal.calories);
            if (newCalories === null) return;
            
            const newProtein = prompt("Edit Protein (g):", meal.protein);
            if (newProtein === null) return;
            
            meal.name = newName.trim() || meal.name;
            meal.calories = Math.round(Number(newCalories)) || 0;
            meal.protein = Math.round(Number(newProtein)) || 0;
            
            learnFood(meal.name, meal.calories, meal.protein);
            
            saveStateToStorage();
            renderAll();
            triggerSheetsSync();
          }
        });
      });
    } else {
      const emptyRow = document.createElement("div");
      emptyRow.className = "empty-inventory-message";
      emptyRow.innerText = "No food logged today.";
      mealList.appendChild(emptyRow);
    }
  }
}

function renderDictionaryManager() {
  const tbody = document.getElementById("dictionary-list-rows");
  if (!tbody) return;
  tbody.innerHTML = "";
  
  const keys = Object.keys(state.customFoods).sort();
  
  if (keys.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">NO MEMORIZED MEALS</td></tr>`;
    return;
  }
  
  keys.forEach(key => {
    const food = state.customFoods[key];
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="monospace">${key}</td>
      <td class="monospace">${food.calories}</td>
      <td class="monospace">${food.protein}g</td>
      <td>
        <button class="btn-mini-delete btn-dict-delete" data-food="${key}">DELETE</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  document.querySelectorAll(".btn-dict-delete").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const foodName = e.target.dataset.food;
      sfx.play('click');
      removeLearnedFood(foodName);
    });
  });
}

function renderHistoryLogs() {
  const tbody = document.getElementById("history-list-rows");
  if (!tbody) return;
  tbody.innerHTML = "";
  
  if (state.history.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">NO HISTORICAL ARCHIVES</td></tr>`;
    return;
  }
  
  state.history.forEach(h => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="monospace">${h.date}</td>
      <td class="monospace">${h.calories}</td>
      <td class="monospace">${h.protein}g</td>
      <td class="monospace">${h.workoutTag}</td>
      <td class="monospace text-cyan">SYNCED</td>
    `;
    tbody.appendChild(tr);
  });
}

// ================= CLOCK =================
function startClock() {
  setInterval(() => {
    const now = new Date();
    const clock = document.getElementById("sys-clock");
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    if (clock) clock.innerText = `${hours}:${minutes}:${seconds}`;
  }, 1000);
}

// ================= SAFE CLICK BINDER =================
function bindClick(id, callback) {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("click", (e) => {
      callback(e);
    });
  }
}

// ================= BOOTSTRAP EVENT LISTENERS =================
document.addEventListener("DOMContentLoaded", () => {
  // 3D Parallax Tilt Effect for Diegetic UI
  const hudContainer = document.querySelector(".hud-container");
  if (hudContainer) {
    document.addEventListener("mousemove", (e) => {
      const xAxis = (window.innerWidth / 2 - e.clientX) / 95;
      const yAxis = (window.innerHeight / 2 - e.clientY) / 95;
      hudContainer.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    });
    
    document.addEventListener("mouseleave", () => {
      hudContainer.style.transform = "rotateY(0deg) rotateX(0deg)";
    });
    
    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", (e) => {
        if (e.beta !== null && e.gamma !== null) {
          const tiltX = Math.min(Math.max(e.gamma / 3.5, -8), 8);
          const tiltY = Math.min(Math.max((e.beta - 45) / 3.5, -8), 8);
          hudContainer.style.transform = `rotateY(${tiltX}deg) rotateX(${tiltY}deg)`;
        }
      });
    }
  }

  // Global click-triggered digital glitch
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (target.matches("button, .hud-btn, .hud-btn-gear, .btn-item-action, .btn-mini-delete, .dialog-close, select, .terminal-portrait-container")) {
      triggerGlitch();
    }
  });

  // Bind click on portrait for dynamic AI advice
  bindClick("coach-portrait-container", () => {
    generateAIAdvice();
  });

  loadStateFromStorage();
  
  const localToday = getFormattedLocalDate();
  const sysDate = document.getElementById("sys-date");
  if (sysDate) sysDate.innerText = localToday.replace(/-/g, '.');
  checkDateTransition();
  
  startClock();
  
  // Onboarding overlay check
  checkOnboardingStatus();
  
  // Bind password toggle visibility buttons
  document.querySelectorAll(".btn-toggle-visibility").forEach(btn => {
    btn.addEventListener("click", (e) => {
      sfx.play('click');
      const targetId = e.currentTarget.dataset.target;
      const input = document.getElementById(targetId);
      if (input) {
        if (input.type === "password") {
          input.type = "text";
          e.currentTarget.innerText = "🔒";
        } else {
          input.type = "password";
          e.currentTarget.innerText = "👁️";
        }
      }
    });
  });
  
  renderAll();
  
  // Update Sync indicator
  const syncIndicator = document.getElementById("sync-status");
  if (syncIndicator) {
    if (state.settings.sheetUrl) {
      syncIndicator.className = "status-value status-indicator offline";
      syncIndicator.querySelector(".indicator-text").innerText = "Sync Pending";
    } else {
      syncIndicator.className = "status-value status-indicator offline";
      syncIndicator.querySelector(".indicator-text").innerText = "Sheet Link Missing";
    }
  }

  // Bind dialog close buttons (robust, loop-safe)
  document.querySelectorAll(".btn-close-dialog").forEach(btn => {
    btn.addEventListener("click", (e) => {
      sfx.play('click');
      e.target.closest("dialog").close();
    });
  });

  // Settings Console Open Handler
  const openSettingsFunc = () => {
    sfx.play('beep');
    const keyEl = document.getElementById("config-gemini-key");
    const urlEl = document.getElementById("config-sheet-url");
    const proFloorEl = document.getElementById("config-protein-floor");
    const proTargetEl = document.getElementById("config-protein-target");
    const calFloorEl = document.getElementById("config-calorie-floor");
    const calCeilEl = document.getElementById("config-calorie-ceiling");
    
    const settingsGoals = state.settings && state.settings.goals ? state.settings.goals : {};
    
    if (keyEl) keyEl.value = state.settings.geminiApiKey || "";
    if (urlEl) urlEl.value = state.settings.sheetUrl || "";
    if (proFloorEl) proFloorEl.value = settingsGoals.proteinFloor || 150;
    if (proTargetEl) proTargetEl.value = settingsGoals.proteinTarget || 170;
    if (calFloorEl) calFloorEl.value = settingsGoals.calorieFloor || 2400;
    if (calCeilEl) calCeilEl.value = settingsGoals.calorieCeiling || 2550;
    
    const soundBtn = document.getElementById("btn-sound-toggle-menu");
    if (soundBtn) soundBtn.innerText = state.settings.soundEnabled ? "SOUND: ON" : "SOUND: OFF";
    
    const settingsDialog = document.getElementById("dialog-settings");
    if (settingsDialog) settingsDialog.showModal();
  };
  
  bindClick("btn-open-settings", openSettingsFunc);
  bindClick("btn-header-settings", openSettingsFunc);

  // Diagnostics Modal Open
  bindClick("btn-open-diagnostics", () => {
    sfx.play('beep');
    // Pre-populate input values from state
    const inputWeight = document.getElementById("input-weight");
    if (inputWeight) inputWeight.value = state.diagnostics.weight || "";
    
    const selectWorkout = document.getElementById("select-workout");
    if (selectWorkout) selectWorkout.value = state.diagnostics.workoutTag || "Rest";
    
    const textareaWorkout = document.getElementById("textarea-workout");
    if (textareaWorkout) textareaWorkout.value = state.diagnostics.workoutDetails || "";
    
    const diagDialog = document.getElementById("dialog-diagnostics");
    if (diagDialog) diagDialog.showModal();
  });

  // Manual Add Modal Open
  bindClick("btn-open-manual-add", () => {
    sfx.play('beep');
    const nameEl = document.getElementById("manual-food-name");
    const calEl = document.getElementById("manual-food-calories");
    const proEl = document.getElementById("manual-food-protein");
    
    if (nameEl) nameEl.value = "";
    if (calEl) calEl.value = "";
    if (proEl) proEl.value = "";
    
    const manualDialog = document.getElementById("dialog-manual-add");
    if (manualDialog) manualDialog.showModal();
  });

  // Settings Save Submit
  bindClick("btn-save-settings", () => {
    const keyEl = document.getElementById("config-gemini-key");
    const urlEl = document.getElementById("config-sheet-url");
    const proFloorEl = document.getElementById("config-protein-floor");
    const proTargetEl = document.getElementById("config-protein-target");
    const calFloorEl = document.getElementById("config-calorie-floor");
    const calCeilEl = document.getElementById("config-calorie-ceiling");
    
    state.settings.geminiApiKey = keyEl ? keyEl.value.trim() : "";
    state.settings.sheetUrl = urlEl ? urlEl.value.trim() : "";
    
    state.settings.goals = {
      proteinFloor: proFloorEl ? Number(proFloorEl.value) : 150,
      proteinTarget: proTargetEl ? Number(proTargetEl.value) : 170,
      calorieFloor: calFloorEl ? Number(calFloorEl.value) : 2400,
      calorieCeiling: calCeilEl ? Number(calCeilEl.value) : 2550
    };
    
    saveStateToStorage();
    sfx.play('success');
    
    const settingsDialog = document.getElementById("dialog-settings");
    if (settingsDialog) settingsDialog.close();
    
    checkOnboardingStatus();
    renderAll();
    
    if (state.settings.sheetUrl) {
      triggerSheetsSync();
    }
  });

  // Onboarding Setup Back Button
  bindClick("btn-onboarding-back", () => {
    sfx.play('click');
    if (onboardingStep > 1) {
      saveCurrentOnboardingStepData();
      onboardingStep--;
      updateOnboardingStep();
    }
  });

  // Onboarding Setup Next Button
  bindClick("btn-onboarding-next", () => {
    sfx.play('click');
    
    // Save current step data
    saveCurrentOnboardingStepData();
    
    // Validate Step 2 (API Key) before proceeding
    if (onboardingStep === 2) {
      const keyVal = state.settings.geminiApiKey;
      if (!keyVal) {
        sfx.play('error');
        alert("A Gemini API Key is required to decode food ingestion payloads.");
        return;
      }
    }
    
    if (onboardingStep < 5) {
      onboardingStep++;
      updateOnboardingStep();
    } else {
      // Close onboarding and save
      saveStateToStorage();
      sfx.play('success');
      
      const overlay = document.getElementById("onboarding-overlay");
      if (overlay) overlay.classList.add("hidden");
      
      renderAll();
      if (state.settings.sheetUrl) {
        triggerSheetsSync();
      }
    }
  });

  // Onboarding Close button (for skipping/closing tutorial)
  bindClick("btn-onboarding-close", () => {
    sfx.play('click');
    
    // Save whatever was entered
    saveCurrentOnboardingStepData();
    saveStateToStorage();
    
    const overlay = document.getElementById("onboarding-overlay");
    if (overlay) overlay.classList.add("hidden");
    
    renderAll();
  });

  // Help / Tutorial Button in Header
  bindClick("btn-header-tutorial", () => {
    showOnboardingOverlay();
  });

  // Dictionary manual add
  bindClick("btn-dict-add", () => {
    const nameEl = document.getElementById("dict-new-name");
    const calEl = document.getElementById("dict-new-calories");
    const proEl = document.getElementById("dict-new-protein");
    
    const name = nameEl ? nameEl.value.trim() : "";
    const calories = calEl ? calEl.value : "";
    const protein = proEl ? proEl.value : "";
    
    if (name && calories && protein) {
      learnFood(name, calories, protein);
      sfx.play('success');
      
      if (nameEl) nameEl.value = "";
      if (calEl) calEl.value = "";
      if (proEl) proEl.value = "";
      renderDictionaryManager();
    } else {
      sfx.play('error');
      alert("Please enter a food name, calories, and protein.");
    }
  });

  // Manual Ingest log item
  bindClick("btn-submit-manual", () => {
    const nameEl = document.getElementById("manual-food-name");
    const calEl = document.getElementById("manual-food-calories");
    const proEl = document.getElementById("manual-food-protein");
    
    const name = nameEl ? nameEl.value.trim() : "";
    const calories = calEl ? calEl.value : "";
    const protein = proEl ? proEl.value : "";
    
    if (name && calories && protein) {
      const now = new Date();
      const timeStr = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0');
      
      const newMeal = {
        id: 'meal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        time: timeStr,
        name: name,
        calories: Math.round(Number(calories)) || 0,
        protein: Math.round(Number(protein)) || 0
      };
      
      state.logs.push(newMeal);
      learnFood(name, calories, protein);
      
      saveStateToStorage();
      sfx.play('success');
      
      const manualDialog = document.getElementById("dialog-manual-add");
      if (manualDialog) manualDialog.close();
      
      renderAll();
      triggerSheetsSync();
    } else {
      sfx.play('error');
      alert("Please enter a valid food name, calories, and protein.");
    }
  });

  // Wipe History Logs
  bindClick("btn-clear-history", () => {
    if (confirm("Are you sure you want to delete all historical logs?")) {
      state.history = [];
      saveStateToStorage();
      sfx.play('error');
      renderHistoryLogs();
    }
  });

  // Clear food inputs
  bindClick("btn-clear-input", () => {
    sfx.play('click');
    const textarea = document.getElementById("textarea-intake");
    if (textarea) textarea.value = "";
  });

  // Sound Toggle inside Settings Menu
  bindClick("btn-sound-toggle-menu", () => {
    state.settings.soundEnabled = !state.settings.soundEnabled;
    saveStateToStorage();
    const soundBtn = document.getElementById("btn-sound-toggle-menu");
    if (soundBtn) soundBtn.innerText = state.settings.soundEnabled ? "SOUND: ON" : "SOUND: OFF";
    sfx.play('click');
  });

  // Force Sync inside Settings Menu
  bindClick("btn-force-sync-menu", () => {
    sfx.play('beep');
    triggerSheetsSync();
  });

  // History button inside Settings Menu
  bindClick("btn-open-history-menu", () => {
    sfx.play('beep');
    renderHistoryLogs();
    const historyDialog = document.getElementById("dialog-history");
    if (historyDialog) historyDialog.showModal();
  });

  // Wipe daily logs inside Settings Menu
  bindClick("btn-wipe-data-menu", () => {
    if (confirm("Are you sure you want to wipe today's nutrition logs? This resets your gauges to zero.")) {
      state.logs = [];
      saveStateToStorage();
      sfx.play('error');
      
      const settingsDialog = document.getElementById("dialog-settings");
      if (settingsDialog) settingsDialog.close();
      
      renderAll();
      triggerSheetsSync();
    }
  });

  // Transmit food input
  bindClick("btn-transmit-intake", () => {
    const textEl = document.getElementById("textarea-intake");
    const text = textEl ? textEl.value.trim() : "";
    if (text) {
      parseIngestionWithAI(text);
    } else {
      sfx.play('error');
      alert("Please write or dictate your meal first.");
    }
  });

  // Commit Diagnostics (Weight / Workout) - closes modal dialog afterwards
  bindClick("btn-save-diagnostics", () => {
    const weightVal = document.getElementById("input-weight").value.trim();
    const workoutTagVal = document.getElementById("select-workout").value;
    const workoutDetailsVal = document.getElementById("textarea-workout").value.trim();
    
    state.diagnostics.weight = weightVal ? Number(weightVal) : null;
    state.diagnostics.workoutTag = workoutTagVal;
    state.diagnostics.workoutDetails = workoutDetailsVal;
    
    saveStateToStorage();
    sfx.play('success');
    
    // Close the diagnostics dialog
    const diagDialog = document.getElementById("dialog-diagnostics");
    if (diagDialog) diagDialog.close();
    
    renderAll();
    triggerSheetsSync();
  });

  // Native dictation is used via the device keyboard; no speech listeners needed
  
  // Set initial time
  const now = new Date();
  const clock = document.getElementById("sys-clock");
  if (clock) clock.innerText = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0') + ":" + String(now.getSeconds()).padStart(2, '0');
});
