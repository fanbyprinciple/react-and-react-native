import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';

// --- FONTS & ICONS ---
import { PressStart2P_400Regular, useFonts } from '@expo-google-fonts/press-start-2p';
import { ArrowLeft, Calendar, Clock, Cloud, MoreHorizontal, Plus, Trash2, WifiOff, X } from 'lucide-react-native';

// --- FIREBASE IMPORTS ---
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getFirestore, onSnapshot, updateDoc } from 'firebase/firestore';

// --- CONFIGURATION ---
const firebaseConfig = null; // PASTE CONFIG HERE

// --- MODERN RETRO PALETTE (Subtle & Functional) ---
const THEME = {
  bg: '#f3f4f6',         // Very light grey (Paper-like)
  surface: '#ffffff',    // Pure white for cards
  primary: '#2e2e2e',    // Almost Black (Ink)
  secondary: '#6b7280',  // Grey text
  accent: '#4f46e5',     // Indigo (for highlights)
  border: '#e5e7eb',     // Light border
  danger: '#ef4444',     // Red
  success: '#10b981',    // Green
};

export default function App() {
  let [fontsLoaded] = useFonts({ PressStart2P_400Regular });

  // --- STATE ---
  const [view, setView] = useState('family');
  const [currentUser, setCurrentUser] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  // INPUT
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const scrollRef = useRef(null); // To auto-scroll

  // MEMBER ADD
  const [newMemberName, setNewMemberName] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  
  // FIREBASE
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isOnlineMode, setIsOnlineMode] = useState(false);

  // --- DATA SYNC (Kept same logic, simplified for brevity) ---
  useEffect(() => {
    const loadLocal = async () => {
        const m = await AsyncStorage.getItem('members');
        const t = await AsyncStorage.getItem('tasks');
        if(m) setFamilyMembers(JSON.parse(m));
        if(t) setTasks(JSON.parse(t));
    };

    if (!firebaseConfig) { loadLocal(); return; }
    
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const dbInstance = getFirestore(app);
    setDb(dbInstance);

    signInAnonymously(auth).catch(() => loadLocal());
    return onAuthStateChanged(auth, (user) => {
      if (user) { setUserId(user.uid); setIsOnlineMode(true); }
    });
  }, []);

  useEffect(() => {
    if (!db || !userId) return;
    const unsubM = onSnapshot(collection(db, `artifacts/family-app/users/${userId}/members`), s => {
        const d = s.docs.map(x => ({id:x.id, ...x.data()}));
        setFamilyMembers(d); AsyncStorage.setItem('members', JSON.stringify(d));
    });
    const unsubT = onSnapshot(collection(db, `artifacts/family-app/users/${userId}/tasks`), s => {
        const d = s.docs.map(x => ({id:x.id, ...x.data()}));
        setTasks(d); AsyncStorage.setItem('tasks', JSON.stringify(d));
    });
    return () => { unsubM(); unsubT(); };
  }, [userId, db]);

  // --- ACTIONS ---
  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;
    const colors = ['#e0e7ff', '#ffedd5', '#dcfce7', '#fae8ff']; // Pastel backgrounds
    const newMem = { name: newMemberName, color: colors[Math.floor(Math.random() * colors.length)], id: Date.now().toString() };
    
    if (isOnlineMode) await addDoc(collection(db, `artifacts/family-app/users/${userId}/members`), newMem);
    else {
        const up = [...familyMembers, newMem];
        setFamilyMembers(up); AsyncStorage.setItem('members', JSON.stringify(up));
    }
    setNewMemberName(''); setShowAddMember(false);
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;
    const newTask = {
      memberId: currentUser.id, text: newTaskText, completed: false,
      deadline: newTaskDeadline ? newTaskDeadline.toISOString().split('T')[0] : null,
      createdAt: new Date().toISOString(), id: Date.now().toString()
    };
    
    // Reset UI immediately
    setNewTaskText(''); setNewTaskDeadline(null); 
    
    if (isOnlineMode) await addDoc(collection(db, `artifacts/family-app/users/${userId}/tasks`), { ...newTask, id: undefined });
    else {
        const up = [...tasks, newTask];
        setTasks(up); AsyncStorage.setItem('tasks', JSON.stringify(up));
    }
  };

  const toggleTask = async (id, status) => {
      if(isOnlineMode) await updateDoc(doc(db, `artifacts/family-app/users/${userId}/tasks`, id), { completed: !status });
      else {
          const up = tasks.map(t => t.id === id ? { ...t, completed: !status } : t);
          setTasks(up); AsyncStorage.setItem('tasks', JSON.stringify(up));
      }
  };

  const deleteTask = async (id) => {
      if(isOnlineMode) await deleteDoc(doc(db, `artifacts/family-app/users/${userId}/tasks`, id));
      else {
          const up = tasks.filter(t => t.id !== id);
          setTasks(up); AsyncStorage.setItem('tasks', JSON.stringify(up));
      }
  };

  // --- DATE HANDLER ---
  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setNewTaskDeadline(selectedDate);
  };

  if (!fontsLoaded) return <View style={{flex:1, backgroundColor: THEME.bg}} />;

  const userTasks = currentUser ? tasks.filter(t => t.memberId === currentUser.id) : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      
      {/* --- HEADER (Minimal Retro) --- */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
            <View style={{flexDirection:'row', alignItems:'center', gap: 6}}>
                <View style={styles.led} />
                <Text style={styles.retroText}>BATTERY</Text>
            </View>
            {isOnlineMode ? <Cloud size={14} color={THEME.secondary} /> : <WifiOff size={14} color={THEME.secondary} />}
        </View>
        <View style={styles.headerTitleRow}>
            {view === 'list' ? (
                <TouchableOpacity onPress={() => setView('family')} style={styles.backBtn}>
                    <ArrowLeft size={20} color={THEME.primary} />
                </TouchableOpacity>
            ) : <View style={{width:20}} />}
            
            <Text style={styles.screenTitle}>
                {view === 'family' ? 'FAMILY_OS' : currentUser.name.toUpperCase()}
            </Text>
            
            <View style={{width:20}} />
        </View>
        <View style={styles.separator} />
      </View>

      {/* --- MAIN CONTENT AREA --- */}
      <KeyboardAvoidingView 
        style={{flex: 1}} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        
        {/* VIEW 1: FAMILY GRID */}
        {view === 'family' && (
            <ScrollView contentContainerStyle={styles.gridContainer}>
                {familyMembers.map(m => {
                    const count = tasks.filter(t => t.memberId === m.id && !t.completed).length;
                    return (
                        <TouchableOpacity key={m.id} style={styles.memberCard} onPress={() => { setCurrentUser(m); setView('list'); }}>
                            <View style={[styles.avatar, {backgroundColor: m.color}]}>
                                <Text style={styles.avatarText}>{m.name.charAt(0)}</Text>
                            </View>
                            <View>
                                <Text style={styles.memberName}>{m.name}</Text>
                                <Text style={styles.memberStats}>{count} Pending</Text>
                            </View>
                            <MoreHorizontal size={16} color={THEME.secondary} style={{marginLeft:'auto'}}/>
                        </TouchableOpacity>
                    );
                })}
                <TouchableOpacity style={styles.addMemberBtn} onPress={() => setShowAddMember(true)}>
                    <Plus size={20} color={THEME.secondary} />
                    <Text style={styles.addMemberText}>ADD MEMBER</Text>
                </TouchableOpacity>
            </ScrollView>
        )}

        {/* VIEW 2: TASK LIST */}
        {view === 'list' && (
            <View style={{flex: 1}}>
                <FlatList
                    ref={scrollRef}
                    data={userTasks}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.taskList}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>-- NO DATA --</Text>
                        </View>
                    }
                    renderItem={({item}) => (
                        <View style={[styles.taskRow, item.completed && styles.taskRowDone]}>
                            <TouchableOpacity onPress={() => toggleTask(item.id, item.completed)} style={styles.checkCircle}>
                                {item.completed && <View style={styles.checkInner} />}
                            </TouchableOpacity>
                            
                            <View style={{flex:1}}>
                                <Text style={[styles.taskText, item.completed && styles.taskTextDone]}>
                                    {item.text}
                                </Text>
                                {item.deadline && (
                                    <View style={styles.metaRow}>
                                        <Clock size={10} color={THEME.secondary} />
                                        <Text style={styles.metaText}>{item.deadline}</Text>
                                    </View>
                                )}
                            </View>
                            
                            <TouchableOpacity onPress={() => deleteTask(item.id)} style={{padding: 5}}>
                                <Trash2 size={16} color={THEME.secondary} />
                            </TouchableOpacity>
                        </View>
                    )}
                />

                {/* --- FUNCTIONAL INPUT BAR --- */}
                <View style={styles.inputContainer}>
                    {newTaskDeadline && (
                        <View style={styles.dateBadge}>
                            <Text style={styles.dateBadgeText}>Due: {newTaskDeadline.toLocaleDateString()}</Text>
                            <TouchableOpacity onPress={() => setNewTaskDeadline(null)}>
                                <X size={12} color="white" />
                            </TouchableOpacity>
                        </View>
                    )}
                    
                    <View style={styles.inputWrapper}>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => setShowDatePicker(true)}>
                            <Calendar size={20} color={THEME.secondary} />
                        </TouchableOpacity>
                        
                        <TextInput
                            style={styles.mainInput}
                            placeholder="Type a new task..."
                            placeholderTextColor="#9ca3af"
                            value={newTaskText}
                            onChangeText={setNewTaskText}
                            multiline={false}
                        />
                        
                        <TouchableOpacity 
                            style={[styles.sendBtn, !newTaskText.trim() && {backgroundColor: '#e5e7eb'}]} 
                            disabled={!newTaskText.trim()}
                            onPress={handleAddTask}
                        >
                            <Plus size={20} color={!newTaskText.trim() ? '#9ca3af' : 'white'} />
                        </TouchableOpacity>
                    </View>

                    {/* DATE PICKER LOGIC */}
                    {showDatePicker && (
                        <View style={styles.pickerContainer}>
                             {Platform.OS === 'ios' && (
                                <View style={styles.iosPickerHeader}>
                                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                        <Text style={{color: THEME.accent, fontWeight:'600'}}>Done</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            <DateTimePicker
                                value={newTaskDeadline || new Date()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={handleDateChange}
                            />
                        </View>
                    )}
                </View>
            </View>
        )}
      </KeyboardAvoidingView>

      {/* --- ADD MEMBER MODAL --- */}
      <Modal visible={showAddMember} transparent animationType="fade">
          <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>NEW USER</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="Name" 
                    value={newMemberName}
                    onChangeText={setNewMemberName}
                    autoFocus
                  />
                  <View style={styles.modalButtons}>
                      <TouchableOpacity onPress={() => setShowAddMember(false)} style={styles.modalBtnCancel}>
                          <Text style={styles.btnText}>CANCEL</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleAddMember} style={styles.modalBtnSave}>
                          <Text style={[styles.btnText, {color:'white'}]}>SAVE</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  // --- HEADER ---
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: THEME.bg,
    zIndex: 10,
  },
  headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
  },
  led: {
      width: 6, height: 6, borderRadius: 3, backgroundColor: THEME.danger,
      shadowColor: THEME.danger, shadowOpacity: 0.5, shadowRadius: 3
  },
  retroText: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 8, color: THEME.secondary,
  },
  headerTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
  },
  screenTitle: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 16,
      color: THEME.primary,
  },
  separator: {
      height: 2, backgroundColor: THEME.border, borderRadius: 1
  },
  
  // --- FAMILY GRID ---
  gridContainer: { padding: 20 },
  memberCard: {
      backgroundColor: THEME.surface,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      marginBottom: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: THEME.border,
      // Subtle shadow
      shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  avatar: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center', marginRight: 15
  },
  avatarText: {
      fontFamily: 'PressStart2P_400Regular', fontSize: 16, color: THEME.primary
  },
  memberName: {
      fontSize: 16, fontWeight: '700', color: THEME.primary, marginBottom: 2
  },
  memberStats: {
      fontSize: 12, color: THEME.secondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  addMemberBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      padding: 20, borderWidth: 1, borderColor: THEME.border, borderStyle: 'dashed', borderRadius: 12
  },
  addMemberText: {
      fontFamily: 'PressStart2P_400Regular', fontSize: 10, color: THEME.secondary
  },

  // --- TASK LIST ---
  taskList: { padding: 20, paddingBottom: 100 },
  taskRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: THEME.surface, padding: 16, marginBottom: 10,
      borderRadius: 12, borderWidth: 1, borderColor: THEME.border,
      shadowColor: "#000", shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
  },
  taskRowDone: { opacity: 0.5, backgroundColor: '#f9fafb' },
  checkCircle: {
      width: 22, height: 22, borderRadius: 11,
      borderWidth: 2, borderColor: THEME.secondary,
      alignItems: 'center', justifyContent: 'center'
  },
  checkInner: {
      width: 12, height: 12, borderRadius: 6, backgroundColor: THEME.primary
  },
  taskText: {
      fontSize: 15, color: THEME.primary,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', // Functional Font
      fontWeight: '500'
  },
  taskTextDone: { textDecorationLine: 'line-through', color: THEME.secondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  metaText: { fontSize: 10, color: THEME.secondary },
  emptyState: { alignItems: 'center', marginTop: 50, opacity: 0.3 },
  emptyText: { fontFamily: 'PressStart2P_400Regular', color: THEME.secondary },

  // --- INPUT BAR (Fixed Visibility) ---
  inputContainer: {
      padding: 15,
      backgroundColor: THEME.surface,
      borderTopWidth: 1, borderColor: THEME.border,
  },
  dateBadge: {
      alignSelf: 'flex-start',
      backgroundColor: THEME.secondary,
      borderRadius: 15, paddingHorizontal: 10, paddingVertical: 4,
      marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 6
  },
  dateBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  inputWrapper: {
      flexDirection: 'row', alignItems: 'center', gap: 10
  },
  mainInput: {
      flex: 1, height: 45, backgroundColor: '#f3f4f6',
      borderRadius: 25, paddingHorizontal: 20,
      fontSize: 16, color: '#000', borderWidth: 1, borderColor: THEME.border
  },
  iconBtn: { padding: 5 },
  sendBtn: {
      width: 45, height: 45, borderRadius: 25,
      backgroundColor: THEME.primary,
      alignItems: 'center', justifyContent: 'center'
  },
  
  // --- PICKER ---
  pickerContainer: { backgroundColor: THEME.surface, marginTop: 10 },
  iosPickerHeader: { flexDirection: 'row', justifyContent: 'flex-end', padding: 10, backgroundColor: '#f3f4f6' },

  // --- MODAL ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '80%', backgroundColor: 'white', padding: 25, borderRadius: 20, elevation: 5 },
  modalTitle: { fontFamily: 'PressStart2P_400Regular', textAlign: 'center', marginBottom: 20 },
  modalInput: { backgroundColor: '#f3f4f6', padding: 15, borderRadius: 10, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalBtnCancel: { flex: 1, padding: 15, alignItems: 'center', backgroundColor: '#e5e7eb', borderRadius: 10 },
  modalBtnSave: { flex: 1, padding: 15, alignItems: 'center', backgroundColor: THEME.primary, borderRadius: 10 },
  btnText: { fontFamily: 'PressStart2P_400Regular', fontSize: 10 }
});