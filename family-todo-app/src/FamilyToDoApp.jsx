import React, { useState, useEffect, useCallback } from 'react';
// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, collection, setLogLevel } from 'firebase/firestore';
// UI Imports
import { Plus, Trash2, ArrowLeft, Check, X, Calendar, Clock, Bell, Sparkles, Loader2, WifiOff, Cloud } from 'lucide-react';


// --- GLOBAL CONFIG & ENVIRONMENT CHECK ---
// These global variables are provided by the Canvas environment for Firebase setup.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Determine if we have the configuration necessary to even attempt connecting to the cloud.
const hasFirebaseConfig = !!firebaseConfig;

// --- LOCAL STORAGE KEYS (FOR OFFLINE FALLBACK) ---
const LS_MEMBERS_KEY = 'family_app_members';
const LS_TASKS_KEY = 'family_app_tasks';

// --- LOCAL STORAGE DATA ACCESS FUNCTIONS (OFFLINE MODE) ---
// These functions act as our database when the cloud is unavailable.

/**
 * Loads family members and tasks from the browser's localStorage.
 * @returns {{members: Array, tasks: Array}}
 */
const lsLoadData = () => {
  try {
    // Attempt to parse JSON strings stored under the keys. Default to empty array if key is not found.
    const members = JSON.parse(localStorage.getItem(LS_MEMBERS_KEY) || '[]');
    const tasks = JSON.parse(localStorage.getItem(LS_TASKS_KEY) || '[]');
    return { members, tasks };
  } catch (e) {
    console.error("Error loading from localStorage. Data corrupted.", e);
    // Return empty state on failure to prevent app crash.
    return { members: [], tasks: [] };
  }
};

/**
 * Saves the current state of members and tasks to localStorage.
 * @param {Array} members - The current list of family members.
 * @param {Array} tasks - The current list of tasks.
 */
const lsSaveData = (members, tasks) => {
  localStorage.setItem(LS_MEMBERS_KEY, JSON.stringify(members));
  localStorage.setItem(LS_TASKS_KEY, JSON.stringify(tasks));
};

export default function App() {
  // --- CORE APPLICATION STATE ---
  const [view, setView] = useState('family'); // 'family' (member selection) or 'list' (tasks view)
  const [currentUser, setCurrentUser] = useState(null); // The member object currently viewing the list

  // --- DATA STATE (UPDATED BY FIRESTORE OR LOCAL STORAGE) ---
  const [familyMembers, setFamilyMembers] = useState([]);
  const [tasks, setTasks] = useState([]);

  // --- UI/LOADER STATE ---
  const [newTaskText, setNewTaskText] = useState(''); // Text input for new task
  const [newTaskDeadline, setNewTaskDeadline] = useState(''); // Date input for new task
  const [newMemberName, setNewMemberName] = useState(''); // Name input for new member
  const [showAddMember, setShowAddMember] = useState(false); // Controls visibility of the "Add Member" modal. <-- FIX: Missing useState hook added here.
  const [isAnalyzing, setIsAnalyzing] = useState(false); // Tracks the AI prioritization status
  const [isLoadingData, setIsLoadingData] = useState(true); // Tracks initial data load

  // --- FIREBASE & AUTH STATE ---
  const [db, setDb] = useState(null); // Firestore instance
  const [userId, setUserId] = useState(null); // The authenticated user ID (used for Firestore pathing)
  const [isAuthReady, setIsAuthReady] = useState(false); // True when Firebase auth has completed its check
  // True if Firebase initialized successfully AND user authenticated
  const [isOnlineMode, setIsOnlineMode] = useState(false); 

  // 1. FIREBASE INITIALIZATION AND AUTHENTICATION (Runs once on mount)
  useEffect(() => {
    // If config is missing, we must immediately fall back to local storage mode.
    if (!hasFirebaseConfig) {
      console.log("No Firebase config found. Starting in Offline Mode.");
      const { members, tasks } = lsLoadData();
      setFamilyMembers(members);
      setTasks(tasks);
      setIsLoadingData(false);
      setIsOnlineMode(false);
      return;
    }

    // Set Firebase log level to suppress non-critical warnings
    setLogLevel('error');
    const app = initializeApp(firebaseConfig);
    const authInstance = getAuth(app);
    const dbInstance = getFirestore(app);
    
    setDb(dbInstance);

    // Asynchronously authenticate the user
    const authenticate = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(authInstance, initialAuthToken);
        } else {
          await signInAnonymously(authInstance);
        }
        setIsOnlineMode(true); // Authentication succeeded, enable online operations
      } catch (error) {
        console.error("Firebase Auth Error: Falling back to Offline Mode.", error);
        setIsOnlineMode(false); // Authentication failed, stick to offline mode
      }
    };
    
    // Listen for auth state changes to get the final userId
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        // If auth fails or is not available, use a random ID for path consistency (though security rules will block it if offline mode is true)
        setUserId(crypto.randomUUID()); 
      }
      setIsAuthReady(true); // Auth listener has run its initial check
      setIsLoadingData(false); 
    });

    authenticate();
    return () => unsubscribe();
  }, []); // Empty dependency array means this runs only once on component mount.

  // 2. FIRESTORE REAL-TIME LISTENERS (Only runs if online mode is active)
  useEffect(() => {
    // CRITICAL GUARD CLAUSE: Only proceed if DB is initialized, Auth is ready, and we are confirmed to be operating in Online Mode.
    if (!db || !isAuthReady || !userId || !isOnlineMode) return;

    // Construct the Firestore base path using the app ID and the current user's ID
    const basePath = `artifacts/${appId}/users/${userId}`;
    const membersRef = collection(db, basePath, 'members');
    const tasksRef = collection(db, basePath, 'tasks');

    // Listener for Family Members (Real-time updates)
    const unsubMembers = onSnapshot(membersRef, (snapshot) => {
      const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFamilyMembers(members);

      // UX Improvement: Create a default 'Me' member if the list is empty
      if (members.length === 0) {
        // Use setDoc with a fixed document ID to avoid creating multiple 'Me' profiles on subsequent loads
        setDoc(doc(membersRef, 'initial_member'), {
            name: 'Me',
            color: 'bg-indigo-600',
        }).catch(e => console.error("Error setting initial member:", e));
      }
    }, (error) => console.error("Error fetching members (onSnapshot):", error));

    // Listener for Tasks (Real-time updates)
    const unsubTasks = onSnapshot(tasksRef, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(fetchedTasks);
    }, (error) => console.error("Error fetching tasks (onSnapshot):", error));

    // Cleanup function: Unsubscribe from Firestore listeners when the component unmounts
    return () => {
      unsubMembers();
      unsubTasks();
    };
  }, [db, isAuthReady, userId, isOnlineMode]); // Re-run if these dependencies change

  // 3. LOCAL STORAGE SYNC (Only runs if offline mode is active)
  useEffect(() => {
    // If we are NOT in online mode and data has loaded, save current state to localStorage
    if (!isOnlineMode && !isLoadingData) {
      lsSaveData(familyMembers, tasks);
    }
  }, [familyMembers, tasks, isOnlineMode, isLoadingData]); // Triggered whenever data state changes

  // --- CRUD FUNCTIONS WITH DYNAMIC SWITCHING ---

  const handleMemberSelect = (member) => { setCurrentUser(member); setView('list'); };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const colors = ['bg-purple-500', 'bg-orange-500', 'bg-cyan-500', 'bg-pink-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    // Create a new member object with a temporary local ID
    const newMemberData = { name: newMemberName, color: randomColor, id: Date.now().toString() };

    if (isOnlineMode && db && userId) {
      // 1. ONLINE MODE: Use Firestore
      try {
        const membersRef = collection(db, `artifacts/${appId}/users/${userId}/members`);
        // Use addDoc to create a new document. The real-time listener will update the state.
        await addDoc(membersRef, { name: newMemberName, color: randomColor }); 
      } catch (error) {
        console.error("Online add member failed. Falling back to local.", error);
        // Fallback: If cloud write fails, update the local state for immediate feedback
        setFamilyMembers(prev => [...prev, newMemberData]);
      }
    } else {
      // 2. OFFLINE MODE: Use local state (which syncs to localStorage in useEffect #3)
      setFamilyMembers(prev => [...prev, newMemberData]);
    }

    setNewMemberName('');
    setShowAddMember(false);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim() || !currentUser) return;
    
    // Create the task object with a temporary local ID
    const newTaskData = { 
      memberId: currentUser.id, 
      text: newTaskText, 
      completed: false, 
      deadline: newTaskDeadline || null, 
      createdAt: new Date().toISOString(),
      id: Date.now().toString()
    };

    if (isOnlineMode && db && userId) {
      // 1. ONLINE MODE: Use Firestore
      try {
        const tasksRef = collection(db, `artifacts/${appId}/users/${userId}/tasks`);
        // Omit the local 'id' so Firestore can generate its own unique ID
        await addDoc(tasksRef, { ...newTaskData, id: undefined }); 
      } catch (error) {
        console.error("Online add task failed. Falling back to local.", error);
        setTasks(prev => [...prev, newTaskData]);
      }
    } else {
      // 2. OFFLINE MODE: Use local state
      setTasks(prev => [...prev, newTaskData]);
    }

    setNewTaskText('');
    setNewTaskDeadline('');
  };

  const toggleTask = async (taskId, isCompleted) => {
    if (isOnlineMode && db && userId) {
      // 1. ONLINE MODE: Use Firestore update
      try {
        const taskDocRef = doc(db, `artifacts/${appId}/users/${userId}/tasks`, taskId);
        await updateDoc(taskDocRef, { completed: !isCompleted });
      } catch (error) {
        console.error("Online toggle task failed. Falling back to local.", error);
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !isCompleted } : t));
      }
    } else {
      // 2. OFFLINE MODE: Update local state
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !isCompleted } : t));
    }
  };

  const deleteTask = async (taskId) => {
    if (isOnlineMode && db && userId) {
      // 1. ONLINE MODE: Use Firestore delete
      try {
        const taskDocRef = doc(db, `artifacts/${appId}/users/${userId}/tasks`, taskId);
        await deleteDoc(taskDocRef);
      } catch (error) {
        console.error("Online delete task failed. Falling back to local.", error);
        setTasks(prev => prev.filter(t => t.id !== taskId));
      }
    } else {
      // 2. OFFLINE MODE: Update local state
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };


  // --- GEMINI AI LOGIC (Uses current data state for analysis) ---

  const callGeminiAPI = async (prompt) => {
    // Standard API structure for text generation with retry logic
    const apiKey = ""; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    };

    const delays = [1000, 2000, 4000];
    for (const delay of delays) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                const data = await response.json();
                return JSON.parse(data.candidates[0].content.parts[0].text);
            }
        } catch (error) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error(`AI Request failed after multiple retries.`);
  };

  // useCallback memoizes this function, preventing unnecessary re-creation
  const prioritizeTasks = useCallback(async () => {
    if (!currentUser) return;
    setIsAnalyzing(true);
    
    // Filter tasks for the current user
    const currentList = tasks.filter(t => t.memberId === currentUser.id);
    if (currentList.length === 0) { setIsAnalyzing(false); return; }

    // Prepare data structure for the AI model
    const taskData = currentList.map(t => ({ 
      id: t.id, 
      text: t.text, 
      deadline: t.deadline, 
      completed: t.completed 
    }));

    const prompt = `
      You are an intelligent family assistant. Reorder this list of tasks based on priority.
      
      Rules for sorting:
      1. Uncompleted tasks ALWAYS come before completed tasks.
      2. Tasks with deadlines that are Overdue or Today MUST be at the very top.
      3. Analyze the "text" context: Urgent items (e.g., "pay bills", "medicine") come before leisure (e.g., "watch tv").
      4. Group similar categories (e.g., put all "shopping" items together).
      
      Return ONLY the valid JSON array of the reordered objects. Do not modify IDs, Text, or Deadlines.
      Input: ${JSON.stringify(taskData)}
    `;

    try {
      const sortedList = await callGeminiAPI(prompt);
      
      // Map the original task objects to the new order returned by the AI
      const reorderedTasks = sortedList.map(sortedItem => 
        tasks.find(t => t.id === sortedItem.id)
      ).filter(Boolean); // Filter removes any potential missing tasks

      // Combine the reordered tasks for the current user with tasks for other members
      const otherMembersTasks = tasks.filter(t => t.memberId !== currentUser.id);
      setTasks([...reorderedTasks, ...otherMembersTasks]);
      
    } catch (error) {
      console.error("AI Sort failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentUser, tasks]); 

  // --- RENDER HELPERS AND UI STRUCTURE ---
  const isToday = (d) => d === new Date().toISOString().split('T')[0];
  const isOverdue = (d) => d && d < new Date().toISOString().split('T')[0];

  const currentUserTasks = tasks.filter(t => t.memberId === currentUser?.id);
  const activeCount = currentUserTasks.filter(t => !t.completed).length;
  const dueTodayCount = currentUserTasks.filter(t => !t.completed && isToday(t.deadline)).length;

  const displayUserId = isOnlineMode && userId ? userId : 'Offline Mode';


  if (isLoadingData && hasFirebaseConfig) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 font-sans p-4">
        <Loader2 size={48} className="animate-spin text-indigo-600" />
        <p className="ml-4 font-semibold text-gray-700">Connecting to Cloud...</p>
      </div>
    );
  }


  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 font-sans p-4">
      {/* Mobile Frame - Ensures responsive design */}
      <div className="w-full max-w-md bg-white h-[800px] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative border-8 border-gray-900">
        
        {/* Dynamic Header */}
        <div className={`p-6 pb-8 text-white transition-colors duration-300 ${view === 'list' && currentUser ? currentUser.color : 'bg-indigo-600'}`}>
          <div className="flex items-center justify-between pt-4">
            {view === 'list' ? (
              <button onClick={() => setView('family')} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition">
                <ArrowLeft size={20} />
              </button>
            ) : <div className="w-8"></div>}
            
            <h1 className="text-xl font-bold tracking-wide">
              {view === 'family' ? 'Family Tasks' : `${currentUser.name}'s List`}
            </h1>
            
            {/* AI SMART SORT BUTTON */}
            {view === 'list' && currentUserTasks.length > 0 ? (
              <button 
                onClick={prioritizeTasks}
                disabled={isAnalyzing || activeCount === 0}
                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition disabled:opacity-50"
                title="AI Smart Sort"
              >
                {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
              </button>
            ) : <div className="w-8"></div>}
          </div>
          
          <div className="mt-6">
            <h2 className="text-3xl font-bold">
              {view === 'family' ? 'Who are you?' : `${activeCount} Tasks Pending`}
            </h2>
            <p className="opacity-80 text-sm mt-1">
              {view === 'family' 
                ? 'Select your profile or add a new family member.' 
                : isAnalyzing ? 'AI is prioritizing your day...' : dueTodayCount > 0 ? `⚠️ ${dueTodayCount} due today!` : 'Keep it up!'}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 bg-gray-50 -mt-4 rounded-t-3xl overflow-hidden flex flex-col relative">
          
          {/* OFFLINE/ONLINE STATUS BAR */}
          <div className={`p-2 text-xs text-center truncate font-medium flex items-center justify-center gap-1 ${isOnlineMode ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {isOnlineMode ? (
              <>
                <Cloud size={12} /> Cloud Sync Active | ID: {displayUserId.substring(0, 8)}...
              </>
            ) : (
              <>
                <WifiOff size={12} /> Running in Offline Mode (Local Storage)
              </>
            )}
          </div>

          {/* AI Loading Overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-indigo-600">
              <Loader2 size={48} className="animate-spin mb-2" />
              <span className="font-bold text-sm">Prioritizing...</span>
            </div>
          )}

          {/* VIEW: FAMILY SELECTION */}
          {view === 'family' && (
            <div className="p-6 overflow-y-auto h-full">
              {familyMembers.length === 0 && (
                <div className="text-center text-gray-400 mt-10">
                    <p>No family members found.</p>
                    <p className="text-xs">Please add the first member using the button below.</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {familyMembers.map(member => {
                  const memberTasks = tasks.filter(t => t.memberId === member.id);
                  const urgentCount = memberTasks.filter(t => !t.completed && (isToday(t.deadline) || isOverdue(t.deadline))).length;
                  return (
                    <button
                      key={member.id}
                      onClick={() => handleMemberSelect(member)}
                      className="relative bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 flex flex-col items-center gap-3 border border-gray-100"
                    >
                      {/* Urgent counter badge */}
                      {urgentCount > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-bounce">
                          {urgentCount} due
                        </div>
                      )}
                      <div className={`w-16 h-16 rounded-full ${member.color} flex items-center justify-center text-white shadow-lg`}>
                        <span className="text-2xl font-bold">{member.name.charAt(0)}</span>
                      </div>
                      <div className="text-center">
                        <h3 className="font-bold text-gray-800">{member.name}</h3>
                        <p className="text-xs text-gray-500">{memberTasks.filter(t => !t.completed).length} tasks</p>
                      </div>
                    </button>
                  );
                })}
                <button
                  onClick={() => setShowAddMember(true)}
                  className="bg-gray-100 p-4 rounded-2xl border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-200 group-hover:bg-indigo-200 flex items-center justify-center text-gray-500 group-hover:text-indigo-600 transition"><Plus size={24} /></div>
                  <span className="text-sm font-medium text-gray-500 group-hover:text-indigo-600">Add Member</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW: TO-DO LIST */}
          {view === 'list' && (
            <div className="flex flex-col h-full">
              
              {dueTodayCount > 0 && (
                <div className="bg-orange-100 text-orange-800 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2">
                  <Bell size={12} className="fill-orange-800" /> You have {dueTodayCount} tasks due today!
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {currentUserTasks.length === 0 ? (
                  <div className="text-center text-gray-400 mt-10"><p>No tasks yet.</p></div>
                ) : (
                  currentUserTasks.map(task => {
                    const isDueToday = !task.completed && isToday(task.deadline);
                    const isTaskOverdue = !task.completed && isOverdue(task.deadline);
                    return (
                      <div 
                        key={task.id} 
                        className={`group flex items-center gap-3 p-4 rounded-xl transition-all duration-500 border 
                          ${task.completed ? 'bg-gray-50 border-gray-100 opacity-60' // Completed style
                          : isDueToday ? 'bg-white border-orange-300 shadow-orange-100 shadow-md ring-1 ring-orange-200' // Due Today style
                          : isTaskOverdue ? 'bg-white border-red-200 shadow-sm' // Overdue style
                          : 'bg-white border-gray-100 shadow-sm'}`} // Default active style
                      >
                        {/* Checkbox Button */}
                        <button onClick={() => toggleTask(task.id, task.completed)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-indigo-500'}`}>
                          {task.completed && <Check size={14} className="text-white" />}
                        </button>
                        <div className="flex-1">
                          <span className={`block font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{task.text}</span>
                          {task.deadline && (
                            <div className={`text-[10px] flex items-center gap-1 mt-1 font-bold ${task.completed ? 'text-gray-300' : isDueToday ? 'text-orange-600' : isTaskOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                              <Clock size={10} /> {isDueToday ? 'Due Today' : isTaskOverdue ? 'Overdue' : `Due: ${task.deadline}`}
                            </div>
                          )}
                        </div>
                        {/* Delete Button (visible on hover/focus) */}
                        <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Task Input Form */}
              <div className="p-4 bg-white border-t border-gray-100 shadow-lg z-10">
                <form onSubmit={handleAddTask} className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="Add a new task..." className="flex-1 bg-gray-100 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
                    <button type="submit" disabled={!newTaskText.trim()} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-lg shadow-indigo-200"><Plus size={24} /></button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar size={14} className="text-gray-400" /></div>
                      <input type="date" value={newTaskDeadline} onChange={(e) => setNewTaskDeadline(e.target.value)} className="w-full bg-gray-50 text-gray-500 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-300 border border-gray-200" />
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Add Member */}
        {showAddMember && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl p-6 w-full shadow-2xl">
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">New Family Member</h3><button onClick={() => setShowAddMember(false)}><X size={20} className="text-gray-400" /></button></div>
              <form onSubmit={handleAddMember}>
                <input type="text" autoFocus value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Name (e.g. Grandma)" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-indigo-500" />
                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition">Add Person</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}