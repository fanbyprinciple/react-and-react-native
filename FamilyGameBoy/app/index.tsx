import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';

// --- CONFIGURATION ---
// Replace with your Firebase config or set to null for offline-only mode
const firebaseConfig = null;
/* 
Example Firebase Config:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
*/

// --- THEME ---
const THEME = {
  bg: '#f3f4f6',
  surface: '#ffffff',
  primary: '#2e2e2e',
  secondary: '#6b7280',
  accent: '#4f46e5',
  border: '#e5e7eb',
  danger: '#ef4444',
};

export default function App() {
  // --- STATE ---
  const [view, setView] = useState('family');
  const [currentUser, setCurrentUser] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [tasks, setTasks] = useState([]);

  // INPUT STATE
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(null);

  // MODAL STATE
  const [newMemberName, setNewMemberName] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);

  // SYNC STATE
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isOnlineMode, setIsOnlineMode] = useState(false);

  // --- INIT DATA & SYNC ---
  useEffect(() => {
    const loadLocal = async () => {
      try {
        const m = await AsyncStorage.getItem('members');
        const t = await AsyncStorage.getItem('tasks');
        if (m) setFamilyMembers(JSON.parse(m));
        if (t) setTasks(JSON.parse(t));
      } catch (e) {
        console.error('Error loading local data:', e);
      }
    };

    if (!firebaseConfig) {
      loadLocal();
      return;
    }

    try {
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const dbInstance = getFirestore(app);
      setDb(dbInstance);

      signInAnonymously(auth).catch((error) => {
        console.error('Firebase auth error:', error);
        loadLocal();
      });

      const unsub = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUserId(user.uid);
          setIsOnlineMode(true);
        } else {
          setIsOnlineMode(false);
          loadLocal();
        }
      });

      return () => unsub();
    } catch (e) {
      console.error('Firebase initialization error:', e);
      loadLocal();
    }
  }, []);

  useEffect(() => {
    if (!db || !userId) return;

    const unsubM = onSnapshot(
      collection(db, `artifacts/family-app/users/${userId}/members`),
      (snapshot) => {
        const data = snapshot.docs.map((x) => ({ id: x.id, ...x.data() }));
        setFamilyMembers(data);
        AsyncStorage.setItem('members', JSON.stringify(data));
      },
      (error) => {
        console.error('Members sync error:', error);
      }
    );

    const unsubT = onSnapshot(
      collection(db, `artifacts/family-app/users/${userId}/tasks`),
      (snapshot) => {
        const data = snapshot.docs.map((x) => ({ id: x.id, ...x.data() }));
        setTasks(data);
        AsyncStorage.setItem('tasks', JSON.stringify(data));
      },
      (error) => {
        console.error('Tasks sync error:', error);
      }
    );

    return () => {
      unsubM();
      unsubT();
    };
  }, [userId, db]);

  // --- HANDLERS ---
  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      Alert.alert('Error', 'Please enter a member name');
      return;
    }

    const colors = ['#e0e7ff', '#ffedd5', '#dcfce7', '#fae8ff'];
    const newMem = {
      name: newMemberName.trim(),
      color: colors[Math.floor(Math.random() * colors.length)],
      id: Date.now().toString(),
    };

    try {
      if (isOnlineMode && db && userId) {
        await addDoc(
          collection(db, `artifacts/family-app/users/${userId}/members`),
          newMem
        );
      } else {
        const updated = [...familyMembers, newMem];
        setFamilyMembers(updated);
        await AsyncStorage.setItem('members', JSON.stringify(updated));
      }
      setNewMemberName('');
      setShowAddMember(false);
    } catch (error) {
      console.error('Error adding member:', error);
      Alert.alert('Error', 'Failed to add member');
    }
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;

    const newTask = {
      memberId: currentUser.id,
      text: newTaskText.trim(),
      completed: false,
      deadline: newTaskDeadline
        ? newTaskDeadline.toISOString().split('T')[0]
        : null,
      createdAt: new Date().toISOString(),
      id: Date.now().toString(),
    };

    try {
      if (isOnlineMode && db && userId) {
        const { id, ...taskData } = newTask;
        await addDoc(
          collection(db, `artifacts/family-app/users/${userId}/tasks`),
          taskData
        );
      } else {
        const updated = [...tasks, newTask];
        setTasks(updated);
        await AsyncStorage.setItem('tasks', JSON.stringify(updated));
      }

      setNewTaskText('');
      setNewTaskDeadline(null);
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to add task');
    }
  };

  const toggleTask = async (id, currentStatus) => {
    try {
      if (isOnlineMode && db && userId) {
        await updateDoc(
          doc(db, `artifacts/family-app/users/${userId}/tasks`, id),
          { completed: !currentStatus }
        );
      } else {
        const updated = tasks.map((t) =>
          t.id === id ? { ...t, completed: !currentStatus } : t
        );
        setTasks(updated);
        await AsyncStorage.setItem('tasks', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const deleteTask = async (id) => {
    try {
      if (isOnlineMode && db && userId) {
        await deleteDoc(
          doc(db, `artifacts/family-app/users/${userId}/tasks`, id)
        );
      } else {
        const updated = tasks.filter((t) => t.id !== id);
        setTasks(updated);
        await AsyncStorage.setItem('tasks', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      Alert.alert('Error', 'Failed to delete task');
    }
  };

  // DATE PICKER HANDLERS
  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        setNewTaskDeadline(selectedDate);
      }
    } else {
      // iOS
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const confirmIOSDate = () => {
    if (tempDate) {
      setNewTaskDeadline(tempDate);
    }
    setShowDatePicker(false);
    setTempDate(null);
  };

  const cancelIOSDate = () => {
    setShowDatePicker(false);
    setTempDate(null);
  };

  const userTasks = currentUser
    ? tasks.filter((t) => t.memberId === currentUser.id)
    : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.surface} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {view === 'list' && (
            <TouchableOpacity
              onPress={() => setView('family')}
              style={styles.backBtn}
            >
              <Text style={styles.iconText}>←</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.screenTitle}>
            {view === 'family'
              ? 'FAMILY LISTS'
              : currentUser?.name.toUpperCase()}
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {isOnlineMode ? '☁️' : '📱'}
            </Text>
          </View>
        </View>
      </View>

      {/* KEYBOARD AVOIDING VIEW */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* VIEW 1: FAMILY LIST */}
        {view === 'family' && (
          <FlatList
            data={familyMembers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.gridContainer}
            ListHeaderComponent={
              <TouchableOpacity
                style={styles.addMemberBtn}
                onPress={() => setShowAddMember(true)}
              >
                <Text style={styles.addMemberIcon}>+</Text>
                <Text style={styles.addMemberText}>Add Member</Text>
              </TouchableOpacity>
            }
            renderItem={({ item }) => {
              const count = tasks.filter(
                (t) => t.memberId === item.id && !t.completed
              ).length;
              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => {
                    setCurrentUser(item);
                    setView('list');
                  }}
                >
                  <View style={[styles.avatar, { backgroundColor: item.color }]}>
                    <Text style={styles.avatarText}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardSub}>
                      {count} task{count !== 1 ? 's' : ''} pending
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* VIEW 2: TASK LIST */}
        {view === 'list' && (
          <View style={{ flex: 1 }}>
            <FlatList
              data={userTasks}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.taskList}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No tasks yet. Add one below!
                </Text>
              }
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.taskRow,
                    item.completed && styles.taskRowDone,
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => toggleTask(item.id, item.completed)}
                    style={[
                      styles.checkbox,
                      item.completed && styles.checkboxChecked,
                    ]}
                  >
                    {item.completed && (
                      <Text style={styles.checkMark}>✓</Text>
                    )}
                  </TouchableOpacity>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.taskText,
                        item.completed && styles.taskTextDone,
                      ]}
                    >
                      {item.text}
                    </Text>
                    {item.deadline && (
                      <Text style={styles.metaText}>Due: {item.deadline}</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => deleteTask(item.id)}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteIcon}>🗑</Text>
                  </TouchableOpacity>
                </View>
              )}
            />

            {/* INPUT BAR */}
            <View style={styles.inputContainer}>
              {newTaskDeadline && (
                <View style={styles.dateBadge}>
                  <Text style={styles.dateBadgeText}>
                    Due: {newTaskDeadline.toLocaleDateString()}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setNewTaskDeadline(null)}
                  >
                    <Text style={styles.dateBadgeX}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.inputWrapper}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.iconText}>📅</Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.mainInput}
                  placeholder="Add a task..."
                  placeholderTextColor="#9ca3af"
                  value={newTaskText}
                  onChangeText={setNewTaskText}
                  onSubmitEditing={handleAddTask}
                  returnKeyType="done"
                />

                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    !newTaskText.trim() && styles.sendBtnDisabled,
                  ]}
                  disabled={!newTaskText.trim()}
                  onPress={handleAddTask}
                >
                  <Text style={styles.sendBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              {/* ANDROID DATE PICKER */}
              {showDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={newTaskDeadline || new Date()}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* IOS DATE PICKER MODAL */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={cancelIOSDate}
        >
          <TouchableOpacity
            style={styles.iosDatePickerModal}
            activeOpacity={1}
            onPress={cancelIOSDate}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.iosDatePickerContainer}
            >
              <View style={styles.iosDatePickerHeader}>
                <TouchableOpacity onPress={cancelIOSDate}>
                  <Text style={styles.iosDatePickerBtn}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.iosDatePickerTitle}>Select Date</Text>
                <TouchableOpacity onPress={confirmIOSDate}>
                  <Text
                    style={[
                      styles.iosDatePickerBtn,
                      { fontWeight: 'bold' },
                    ]}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate || newTaskDeadline || new Date()}
                mode="date"
                display="spinner"
                onChange={onDateChange}
                minimumDate={new Date()}
                textColor="#000"
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {/* ADD MEMBER MODAL */}
      <Modal
        visible={showAddMember}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddMember(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Member</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Name"
              value={newMemberName}
              onChangeText={setNewMemberName}
              autoFocus
              onSubmitEditing={handleAddMember}
              returnKeyType="done"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setShowAddMember(false);
                  setNewMemberName('');
                }}
                style={styles.modalBtnCancel}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddMember}
                style={styles.modalBtnSave}
              >
                <Text style={styles.modalBtnTextWhite}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.bg },

  // Header
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
  },
  backBtn: { marginRight: 10, padding: 4 },
  screenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.primary,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontSize: 12 },

  // List Items
  gridContainer: { padding: 16, paddingBottom: 32 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: THEME.primary },
  cardTitle: { fontSize: 16, fontWeight: '600', color: THEME.primary },
  cardSub: { fontSize: 13, color: THEME.secondary, marginTop: 2 },
  chevron: { fontSize: 24, color: '#ccc', marginLeft: 10 },

  // Add Member Button
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#fafafa',
  },
  addMemberIcon: { fontSize: 24, marginRight: 8, color: THEME.secondary },
  addMemberText: { color: THEME.secondary, fontWeight: '600', fontSize: 15 },

  // Tasks
  taskList: { padding: 16, paddingBottom: 120 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  taskRowDone: { opacity: 0.5, backgroundColor: '#f9fafb' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: THEME.accent,
    borderColor: THEME.accent,
  },
  checkMark: { fontSize: 14, color: 'white', fontWeight: 'bold' },
  taskText: { fontSize: 16, color: THEME.primary, lineHeight: 22 },
  taskTextDone: {
    textDecorationLine: 'line-through',
    color: THEME.secondary,
  },
  metaText: { fontSize: 12, color: '#f59e0b', marginTop: 4 },
  deleteBtn: { padding: 8 },
  deleteIcon: { fontSize: 18 },
  emptyText: {
    textAlign: 'center',
    marginTop: 60,
    color: '#9ca3af',
    fontSize: 16,
  },

  // Input Bar
  inputContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderColor: THEME.border,
  },
  dateBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: THEME.accent,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
    alignItems: 'center',
  },
  dateBadgeText: { color: 'white', fontSize: 12, marginRight: 8 },
  dateBadgeX: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 8 },
  iconText: { fontSize: 22 },
  mainInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#f3f4f6',
    borderRadius: 22,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    fontSize: 16,
    color: THEME.primary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#d1d5db' },
  sendBtnText: { color: 'white', fontSize: 24, fontWeight: 'bold' },

  // iOS Date Picker Modal
  iosDatePickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  iosDatePickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
  },
  iosDatePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  iosDatePickerBtn: {
    fontSize: 17,
    color: THEME.accent,
  },
  iosDatePickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: THEME.primary,
  },

  // Add Member Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: THEME.primary,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
    color: THEME.primary,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtnCancel: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  modalBtnSave: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    backgroundColor: THEME.accent,
    borderRadius: 8,
  },
  modalBtnText: {
    fontSize: 16,
    color: THEME.primary,
    fontWeight: '500',
  },
  modalBtnTextWhite: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});
