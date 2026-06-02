require('../config/dnsSet');

import mongoose from 'mongoose';
import readline from 'readline';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/dnsSet';
import Admin from '../models/admin/Admin';
import User from '../models/client/User';
import Message from '../models/client/Message';
import Chat from '../models/client/Chat';
import Group from '../models/client/Group';
import Status from '../models/client/Status';
import Call from '../models/client/Call';
import Payment from '../models/client/Payment';
import PendingActivation from '../models/client/PendingActivation';
import Contact from '../models/client/Contact';
import Session from '../models/client/Session';
import Notification from '../models/client/Notification';
import Backup from '../models/client/Backup';
import SystemBackup from '../models/admin/SystemBackup';
import Report from '../models/admin/Report';
import Ticket from '../models/admin/Ticket';
import Warning from '../models/admin/Warning';
import Ban from '../models/admin/Ban';
import ModerationLog from '../models/admin/ModerationLog';
import Settings from '../models/admin/Settings';
import DeepLink from '../models/client/DeepLink';
import AiConfig from '../models/admin/AiConfig';
import SoundPack from '../models/admin/SoundPack';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function printHeader(): void {
  console.clear();
  console.log('');
  console.log('  ⚡ ═══════════════════════════════════════ ⚡');
  console.log('  ⚡       SPARK MESSENGER — ADMIN CLI        ⚡');
  console.log('  ⚡          Powered by HDM                  ⚡');
  console.log('  ⚡ ═══════════════════════════════════════ ⚡');
  console.log('');
}

function printMenu(): void {
  printHeader();
  console.log('  📋 ADMINISTRATOR MANAGEMENT');
  console.log('  ─────────────────────────────');
  console.log('  1.  List all admins');
  console.log('  2.  Create new admin');
  console.log('  3.  Change admin role');
  console.log('  4.  Toggle admin active status');
  console.log('  5.  Delete admin');
  console.log('');
  console.log('  🗄️  DATABASE MANAGEMENT');
  console.log('  ─────────────────────────────');
  console.log('  6.  List all collections');
  console.log('  7.  Show collection stats');
  console.log('  8.  Drop a collection');
  console.log('  9.  Drop entire database');
  console.log('');
  console.log('  ⚙️  SYSTEM');
  console.log('  ─────────────────────────────');
  console.log('  10. View system settings');
  console.log('  11. Toggle maintenance mode');
  console.log('  12. System health check');
  console.log('');
  console.log('  0.  Exit');
  console.log('');
}

// ====================================================================
// ADMIN MANAGEMENT
// ====================================================================

async function listAdmins(): Promise<void> {
  console.log('\n  📋 ALL ADMINISTRATORS\n');
  const admins = await Admin.find().sort({ createdAt: -1 }).lean();

  if (admins.length === 0) {
    console.log('  No admins found.');
    return;
  }

  admins.forEach((admin, index) => {
    const activeIcon = admin.isActive ? '🟢' : '🔴';
    console.log(`  ${index + 1}. ${activeIcon} ${admin.displayName}`);
    console.log(`     Email: ${admin.email}`);
    console.log(`     Role: ${admin.role}`);
    console.log(`     Last Login: ${admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'Never'}`);
    console.log(`     ID: ${admin._id}`);
    console.log('');
  });
}

async function createAdmin(): Promise<void> {
  console.log('\n  ➕ CREATE NEW ADMIN\n');

  const email = await question('  Email: ');
  if (!email) {
    console.log('  ❌ Email is required.');
    return;
  }

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log('  ❌ Admin with this email already exists.');
    return;
  }

  const displayName = await question('  Display Name: ');
  if (!displayName) {
    console.log('  ❌ Display name is required.');
    return;
  }

  const password = await question('  Password: ');
  if (!password || password.length < 6) {
    console.log('  ❌ Password must be at least 6 characters.');
    return;
  }

  console.log('\n  Roles: super_admin | admin | moderator');
  const role = await question('  Role (default: admin): ');
  const validRole = ['super_admin', 'admin', 'moderator'].includes(role) ? role : 'admin';

  const admin = await Admin.create({
    email,
    password,
    displayName,
    role: validRole,
    isActive: true,
  });

  console.log(`\n  ✅ Admin created: ${admin.displayName} (${admin.email}) [${admin.role}]`);
}

async function changeAdminRole(): Promise<void> {
  console.log('\n  🔄 CHANGE ADMIN ROLE\n');
  await listAdmins();

  const email = await question('  Admin email to change: ');
  if (!email) return;

  const admin = await Admin.findOne({ email });
  if (!admin) {
    console.log('  ❌ Admin not found.');
    return;
  }

  console.log(`\n  Current role: ${admin.role}`);
  console.log('  Available: super_admin | admin | moderator');
  const newRole = await question('  New role: ');

  if (!['super_admin', 'admin', 'moderator'].includes(newRole)) {
    console.log('  ❌ Invalid role.');
    return;
  }

  admin.role = newRole;
  await admin.save();

  console.log(`  ✅ Role changed to: ${newRole}`);
}

async function toggleAdminStatus(): Promise<void> {
  console.log('\n  🔄 TOGGLE ADMIN STATUS\n');
  await listAdmins();

  const email = await question('  Admin email to toggle: ');
  if (!email) return;

  const admin = await Admin.findOne({ email });
  if (!admin) {
    console.log('  ❌ Admin not found.');
    return;
  }

  admin.isActive = !admin.isActive;
  await admin.save();

  console.log(`  ✅ ${admin.displayName} is now ${admin.isActive ? 'ACTIVE 🟢' : 'INACTIVE 🔴'}`);
}

async function deleteAdmin(): Promise<void> {
  console.log('\n  🗑️  DELETE ADMIN\n');
  await listAdmins();

  const email = await question('  Admin email to delete: ');
  if (!email) return;

  const confirm = await question(`  ⚠️  Are you sure? Type "DELETE" to confirm: `);
  if (confirm !== 'DELETE') {
    console.log('  Cancelled.');
    return;
  }

  const result = await Admin.deleteOne({ email });
  if (result.deletedCount > 0) {
    console.log('  ✅ Admin deleted.');
  } else {
    console.log('  ❌ Admin not found.');
  }
}

// ====================================================================
// DATABASE MANAGEMENT
// ====================================================================

async function listCollections(): Promise<void> {
  console.log('\n  🗄️  ALL COLLECTIONS\n');

  const collections = await mongoose.connection.db!.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name).sort();

  collectionNames.forEach((name, index) => {
    console.log(`  ${(index + 1).toString().padStart(3)}. ${name}`);
  });

  console.log(`\n  Total: ${collectionNames.length} collections`);
}

async function showCollectionStats(): Promise<void> {
  console.log('\n  📊 COLLECTION STATISTICS\n');

  const modelMap: Record<string, any> = {
    users: User,
    messages: Message,
    chats: Chat,
    groups: Group,
    statuses: Status,
    calls: Call,
    payments: Payment,
    pendingactivations: PendingActivation,
    contacts: Contact,
    sessions: Session,
    notifications: Notification,
    backups: Backup,
    systembackups: SystemBackup,
    reports: Report,
    tickets: Ticket,
    warnings: Warning,
    bans: Ban,
    moderationlogs: ModerationLog,
    settings: Settings,
    deeplinks: DeepLink,
    aiconfigs: AiConfig,
    soundpacks: SoundPack,
    admins: Admin,
  };

  const collections = await mongoose.connection.db!.listCollections().toArray();

  for (const col of collections.sort((a, b) => a.name.localeCompare(b.name))) {
    const model = modelMap[col.name];
    if (model) {
      const count = await model.countDocuments();
      const sizeKB = ((col.options?.size || 0) / 1024).toFixed(1);
      console.log(`  ${col.name.padEnd(25)} ${count.toString().padStart(8)} docs  ${sizeKB.padStart(8)} KB`);
    } else {
      console.log(`  ${col.name.padEnd(25)} ${'—'.padStart(8)}       ${'—'.padStart(8)}`);
    }
  }
}

async function dropCollection(): Promise<void> {
  console.log('\n  🗑️  DROP COLLECTION\n');
  await listCollections();

  const name = await question('  Collection name to drop: ');
  if (!name) return;

  const collections = await mongoose.connection.db!.listCollections({ name }).toArray();
  if (collections.length === 0) {
    console.log('  ❌ Collection not found.');
    return;
  }

  const confirm = await question(`  ⚠️  This will DELETE ALL DATA in "${name}". Type "DROP" to confirm: `);
  if (confirm !== 'DROP') {
    console.log('  Cancelled.');
    return;
  }

  await mongoose.connection.db!.dropCollection(name);
  console.log(`  ✅ Collection "${name}" dropped.`);
}

async function dropDatabase(): Promise<void> {
  console.log('\n  💀 DROP ENTIRE DATABASE\n');

  const dbName = mongoose.connection.db!.databaseName;
  console.log(`  Database: ${dbName}`);

  const confirm1 = await question(`  ⚠️  This will DELETE EVERYTHING. Type database name to continue: `);
  if (confirm1 !== dbName) {
    console.log('  Cancelled.');
    return;
  }

  const confirm2 = await question(`  ⚠️  FINAL WARNING. Type "DESTROY" to confirm: `);
  if (confirm2 !== 'DESTROY') {
    console.log('  Cancelled.');
    return;
  }

  await mongoose.connection.db!.dropDatabase();
  console.log('  ✅ Database dropped. All collections removed.');
}

// ====================================================================
// SYSTEM
// ====================================================================

async function viewSettings(): Promise<void> {
  console.log('\n  ⚙️  SYSTEM SETTINGS\n');

  const settings = await Settings.findOne().lean();
  if (!settings) {
    console.log('  No settings found. Defaults will apply.');
    return;
  }

  console.log('  App Settings:');
  console.log(`    Name: ${settings.appName}`);
  console.log(`    Description: ${settings.appDescription}`);
  console.log(`    Contact: ${settings.contactEmail}`);
  console.log(`    Timezone: ${settings.timezone}`);
  console.log('');
  console.log('  Payment Methods:');
  console.log(`    Stripe: ${settings.paymentMethods?.stripe ? '✅' : '❌'}`);
  console.log(`    M-Pesa STK Push: ${settings.paymentMethods?.mpesaStkPush ? '✅' : '❌'}`);
  console.log(`    M-Pesa Send Money: ${settings.paymentMethods?.mpesaSendMoney ? '✅' : '❌'}`);
  console.log(`    M-Pesa Paybill: ${settings.paymentMethods?.mpesaPaybill ? '✅' : '❌'}`);
  console.log(`    M-Pesa Till: ${settings.paymentMethods?.mpesaTill ? '✅' : '❌'}`);
  console.log(`    PayPal: ${settings.paymentMethods?.paypal ? '✅' : '❌'}`);
  console.log('');
  console.log('  Plans:');
  console.log(`    Monthly: ${settings.planCurrency} ${settings.planMonthlyPrice}`);
  console.log(`    Yearly: ${settings.planCurrency} ${settings.planYearlyPrice}`);
  console.log(`    Permanent: ${settings.planCurrency} ${settings.planPermanentPrice}`);
  console.log(`    Currency: ${settings.planCurrency}`);
  console.log('');
  console.log(`  Maintenance Mode: ${settings.isMaintenanceMode ? '🟡 ON' : '🟢 OFF'}`);
}

async function toggleMaintenance(): Promise<void> {
  console.log('\n  🔧 TOGGLE MAINTENANCE MODE\n');

  const settings = await Settings.findOne();
  if (!settings) {
    console.log('  No settings found. Creating...');
    await Settings.create({});
  }

  const current = await Settings.findOne();
  const newState = !current?.isMaintenanceMode;

  await Settings.findOneAndUpdate(
    {},
    { isMaintenanceMode: newState },
    { upsert: true },
  );

  console.log(`  ✅ Maintenance mode: ${newState ? '🟡 ON' : '🟢 OFF'}`);
}

async function systemHealth(): Promise<void> {
  console.log('\n  🏥 SYSTEM HEALTH\n');

  // MongoDB
  try {
    const ping = await mongoose.connection.db!.admin().ping();
    console.log(`  MongoDB: ${ping.ok === 1 ? '🟢 Connected' : '🔴 Error'}`);
  } catch {
    console.log('  MongoDB: 🔴 Disconnected');
  }

  // Counts
  const userCount = await User.countDocuments({ isDeleted: false });
  const messageCount = await Message.countDocuments();
  const chatCount = await Chat.countDocuments({ isDeleted: false });
  const groupCount = await Group.countDocuments({ isDeleted: false });
  const onlineUsers = await User.countDocuments({ status: 'online' });

  console.log('');
  console.log('  Statistics:');
  console.log(`    Users: ${userCount} (${onlineUsers} online)`);
  console.log(`    Messages: ${messageCount}`);
  console.log(`    Chats: ${chatCount}`);
  console.log(`    Groups: ${groupCount}`);
  console.log('');

  // Memory
  const memUsage = process.memoryUsage();
  console.log('  Memory:');
  console.log(`    RSS: ${(memUsage.rss / 1024 / 1024).toFixed(1)} MB`);
  console.log(`    Heap: ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)} MB / ${(memUsage.heapTotal / 1024 / 1024).toFixed(1)} MB`);

  // Uptime
  const uptime = process.uptime();
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  console.log(`\n  Uptime: ${days}d ${hours}h ${minutes}m`);
}

// ====================================================================
// MAIN
// ====================================================================

async function main(): Promise<void> {
  await connectDB();

  while (true) {
    printMenu();
    const choice = await question('  Enter choice: ');

    switch (choice) {
      case '1':
        await listAdmins();
        break;
      case '2':
        await createAdmin();
        break;
      case '3':
        await changeAdminRole();
        break;
      case '4':
        await toggleAdminStatus();
        break;
      case '5':
        await deleteAdmin();
        break;
      case '6':
        await listCollections();
        break;
      case '7':
        await showCollectionStats();
        break;
      case '8':
        await dropCollection();
        break;
      case '9':
        await dropDatabase();
        break;
      case '10':
        await viewSettings();
        break;
      case '11':
        await toggleMaintenance();
        break;
      case '12':
        await systemHealth();
        break;
      case '0':
        console.log('\n  👋 Goodbye!\n');
        await disconnectDB();
        rl.close();
        process.exit(0);
      default:
        console.log('\n  ❌ Invalid choice. Try again.');
    }

    if (choice !== '0') {
      await question('\n  Press Enter to continue...');
    }
  }
}

main().catch(async (error) => {
  console.error('Fatal error:', error);
  await disconnectDB();
  rl.close();
  process.exit(1);
});