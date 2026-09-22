const STORAGE_KEY = 'fintrackUsers';
const CURRENT_KEY = 'fintrackCurrentUser';

const normalizeUserRecord = (userData) => ({
  email: (userData.email || '').trim().toLowerCase(),
  password: userData.password || '',
  name: userData.name || 'FinTrack User',
  transactions: Array.isArray(userData.transactions) ? userData.transactions : [],
  goals: userData.goals || { title: 'Save Smart', target: 0, progress: 0 },
  lastInsight: userData.lastInsight || '',
});

const loadUsers = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
};

const saveUsers = (users) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

export const getUsers = () => loadUsers();

export const findUser = (email) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  return loadUsers().find((user) => user.email === normalizedEmail) || null;
};

export const getCurrentUser = () => {
  const currentEmail = localStorage.getItem(CURRENT_KEY);
  if (!currentEmail) return null;
  return findUser(currentEmail);
};

export const getUserData = () => getCurrentUser();

export const setCurrentUserKey = (email) => {
  localStorage.setItem(CURRENT_KEY, (email || '').trim().toLowerCase());
};

export const removeCurrentUserKey = () => {
  localStorage.removeItem(CURRENT_KEY);
};

export const saveUserData = (updatedUser) => {
  const normalized = normalizeUserRecord(updatedUser);
  const users = loadUsers();
  const index = users.findIndex((user) => user.email === normalized.email);

  if (index !== -1) {
    users[index] = normalized;
  } else {
    users.push(normalized);
  }

  saveUsers(users);
  if (normalized.email) {
    setCurrentUserKey(normalized.email);
  }
};

export const signUpUser = (email, password, fullName) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail || !password || !fullName) {
    return { success: false, error: 'Please complete all fields.' };
  }

  if (findUser(normalizedEmail)) {
    return { success: false, error: 'An account with that email already exists.' };
  }

  const user = normalizeUserRecord({
    email: normalizedEmail,
    password,
    name: fullName.trim(),
    transactions: [],
    goals: { title: 'Save Smart', target: 0, progress: 0 },
    lastInsight: '',
  });

  const users = loadUsers();
  users.push(user);
  saveUsers(users);
  setCurrentUserKey(user.email);

  return { success: true, user };
};

export const signInUser = (email, password) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const user = findUser(normalizedEmail);

  if (!user) {
    return { success: false, error: 'No account found for that email.' };
  }

  if (user.password !== password) {
    return { success: false, error: 'Incorrect password.' };
  }

  setCurrentUserKey(user.email);
  return { success: true, user };
};

export const signOutUser = async () => {
  removeCurrentUserKey();
  return true;
};

export const getCurrentAuthUser = () => getCurrentUser();

export const logout = async () => {
  await signOutUser();
  window.location.href = 'login.html';
};

export const listenToAuthState = (callback) => {
  callback(getCurrentUser());
  return () => {};
};

export const onAuthStateChange = (callback) => {
  callback(getCurrentUser());
  return () => {};
};

export const getCurrentUserData = async () => getCurrentUser();

export const updateUserData = (updatedUser) => saveUserData(updatedUser);

export const getUserDataLegacy = () => getCurrentUser();
