import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'db.json');

function initDb() {
  if (!fs.existsSync(DB_PATH)) {
    const initialData = {
      users: [],
      admins: [],
      sosAlerts: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

function readDb() {
  initDb();
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading DB:', error);
    return { users: [], admins: [], sosAlerts: [] };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing DB:', error);
    return false;
  }
}

// User methods
export function getUsers() {
  return readDb().users || [];
}

export function findUserByUsername(username) {
  const users = getUsers();
  return users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

export function addUser(user) {
  const db = readDb();
  db.users = db.users || [];
  db.users.push(user);
  writeDb(db);
  return user;
}

// Admin methods
export function getAdmins() {
  return readDb().admins || [];
}

export function findAdminByUsername(username) {
  const admins = getAdmins();
  return admins.find(a => a.username.toLowerCase() === username.toLowerCase());
}

export function addAdmin(admin) {
  const db = readDb();
  db.admins = db.admins || [];
  db.admins.push(admin);
  writeDb(db);
  return admin;
}

// SOS methods
export function getSosAlerts() {
  return readDb().sosAlerts || [];
}

export function addSosAlert(alert) {
  const db = readDb();
  db.sosAlerts = db.sosAlerts || [];
  // Prevent duplicate active alerts for the same user
  db.sosAlerts = db.sosAlerts.filter(a => a.username !== alert.username);
  db.sosAlerts.push(alert);
  writeDb(db);
  return alert;
}

export function clearSosAlert(username) {
  const db = readDb();
  db.sosAlerts = db.sosAlerts || [];
  db.sosAlerts = db.sosAlerts.filter(a => a.username.toLowerCase() !== username.toLowerCase());
  writeDb(db);
}
