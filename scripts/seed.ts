require('../config/dnsSet');

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import readline from 'readline';
import { connectDB, disconnectDB } from '../config/dnsSet';
import User from '../models/client/User';
import Chat from '../models/client/Chat';
import Message from '../models/client/Message';
import Group from '../models/client/Group';
import Contact from '../models/client/Contact';
import Status from '../models/client/Status';
import Settings from '../models/admin/Settings';
import Admin from '../models/admin/Admin';
import DeepLink from '../models/client/DeepLink';
import AiConfig from '../models/admin/AiConfig';
import Legal from '../models/admin/Legal';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => { rl.question(prompt, resolve); });
}

function printHeader(): void {
  console.clear();
  console.log('');
  console.log('  🌱 ═══════════════════════════════════════ 🌱');
  console.log('  🌱       SPARK MESSENGER — SEEDER           🌱');
  console.log('  🌱          Powered by HDM                  🌱');
  console.log('  🌱 ═══════════════════════════════════════ 🌱');
  console.log('');
}

function printMenu(): void {
  printHeader();
  console.log('  Choose an option:');
  console.log('');
  console.log('  1.  Seed ALL (settings, deeplinks, AI config, admin, legal, 5 users with chats)');
  console.log('  2.  Seed settings only');
  console.log('  3.  Seed deeplinks only');
  console.log('  4.  Seed AI config only');
  console.log('  5.  Seed admin only');
  console.log('  6.  Seed legal documents only');
  console.log('  7.  Seed 5 sample users with chats');
  console.log('  8.  Clear all seed data');
  console.log('');
  console.log('  0.  Exit');
  console.log('');
}

// ====================================================================
// SEED: SETTINGS
// ====================================================================
async function seedSettings(): Promise<void> {
  console.log('\n  ⚙️  Seeding settings...');

  const existing = await Settings.findOne();
  if (existing) {
    console.log('  ⚠️  Settings already exist. Updating...');
    await Settings.findOneAndUpdate({}, {
      appName: 'Spark',
      appDescription: 'Privacy-first messaging by HDM',
      contactEmail: 'davismcintyre5@gmail.com',
      timezone: 'Africa/Nairobi',
      hdmAiUrl: 'https://hdmai-server.onrender.com/api/v1',
      hdmAiKey: 'hdm_spa_3b1a00923453b5c6c25d30e9c20a1df2df4300f8d7a19b78',
      planMonthlyPrice: 1.00,
      planYearlyPrice: 9.99,
      planPermanentPrice: 24.99,
      planCurrency: 'USD',
      paymentMethods: { stripe: true, mpesaStkPush: true, mpesaSendMoney: true, mpesaPaybill: true, mpesaTill: true, paypal: false },
      groupMaxMembers: 1024,
      groupMaxAdmins: 10,
      messageEditWindowMinutes: 15,
      messageDeleteWindowHours: 1,
      statusExpireHours: 24,
      sessionMaxDevices: 5,
      isMaintenanceMode: false,
    });
  } else {
    await Settings.create({
      appName: 'Spark',
      appDescription: 'Privacy-first messaging by HDM',
      contactEmail: 'davismcintyre5@gmail.com',
      timezone: 'Africa/Nairobi',
      hdmAiUrl: 'https://hdmai-server.onrender.com/api/v1',
      hdmAiKey: 'hdm_spa_3b1a00923453b5c6c25d30e9c20a1df2df4300f8d7a19b78',
      planMonthlyPrice: 1.00,
      planYearlyPrice: 9.99,
      planPermanentPrice: 24.99,
      planCurrency: 'USD',
      paymentMethods: { stripe: true, mpesaStkPush: true, mpesaSendMoney: true, mpesaPaybill: true, mpesaTill: true, paypal: false },
      groupMaxMembers: 1024,
      groupMaxAdmins: 10,
      messageEditWindowMinutes: 15,
      messageDeleteWindowHours: 1,
      statusExpireHours: 24,
      sessionMaxDevices: 5,
      isMaintenanceMode: false,
    });
  }

  console.log('  ✅ Settings seeded.');
}

// ====================================================================
// SEED: DEEPLINKS
// ====================================================================
async function seedDeeplinks(): Promise<void> {
  console.log('\n  🔗 Seeding deeplinks...');

  const existing = await DeepLink.countDocuments();
  if (existing > 0) {
    console.log(`  ⚠️  ${existing} deeplinks already exist. Clearing...`);
    await DeepLink.deleteMany({});
  }

  const deeplinks = [
    { platform: 'spark', name: 'viewVibeProfile', description: "View a contact's Vibe profile from Spark", urlScheme: 'vibe://profile?user={phone}', iosScheme: 'vibe://profile?user={phone}', androidScheme: 'vibe://profile?user={phone}', webFallback: 'https://vibe.hdm.com/profile?user={phone}', parameters: [{ name: 'phone', required: true, description: 'User phone number' }], isActive: true },
    { platform: 'spark', name: 'postMessageToVibe', description: 'Post a Spark message to Vibe feed', urlScheme: 'vibe://create/post?text={content}&from=spark', iosScheme: 'vibe://create/post?text={content}&from=spark', androidScheme: 'vibe://create/post?text={content}&from=spark', webFallback: 'https://vibe.hdm.com/create/post?text={content}&from=spark', parameters: [{ name: 'content', required: true, description: 'Post content' }], isActive: true },
    { platform: 'spark', name: 'sparkStatusToVibeStory', description: 'Post Spark status as Vibe story', urlScheme: 'vibe://create/story?media={url}&from=spark', iosScheme: 'vibe://create/story?media={url}&from=spark', androidScheme: 'vibe://create/story?media={url}&from=spark', webFallback: 'https://vibe.hdm.com/create/story?media={url}&from=spark', parameters: [{ name: 'url', required: true, description: 'Media URL' }], isActive: true },
    { platform: 'spark', name: 'viewVibePost', description: 'Open a specific Vibe post from Spark', urlScheme: 'vibe://post?id={postId}', iosScheme: 'vibe://post?id={postId}', androidScheme: 'vibe://post?id={postId}', webFallback: 'https://vibe.hdm.com/post?id={postId}', parameters: [{ name: 'postId', required: true, description: 'Post ID' }], isActive: true },
    { platform: 'spark', name: 'openVibeExplore', description: 'Launch Vibe explore page from Spark', urlScheme: 'vibe://explore', iosScheme: 'vibe://explore', androidScheme: 'vibe://explore', webFallback: 'https://vibe.hdm.com/explore', parameters: [], isActive: true },
    { platform: 'vibe', name: 'messageOnSpark', description: 'Message a user on Spark from Vibe', urlScheme: 'spark://chat/new?user={phone}', iosScheme: 'spark://chat/new?user={phone}', androidScheme: 'spark://chat/new?user={phone}', webFallback: 'https://spark.hdm.com/chat/new?user={phone}', parameters: [{ name: 'phone', required: true, description: 'Phone number' }], isActive: true },
    { platform: 'vibe', name: 'sharePostToSpark', description: 'Share a Vibe post to Spark', urlScheme: 'spark://share?type=post&id={id}&from=vibe', iosScheme: 'spark://share?type=post&id={id}&from=vibe', androidScheme: 'spark://share?type=post&id={id}&from=vibe', webFallback: 'https://spark.hdm.com/share?type=post&id={id}&from=vibe', parameters: [{ name: 'id', required: true, description: 'Post ID' }], isActive: true },
    { platform: 'vibe', name: 'shareReelToSpark', description: 'Share a Vibe reel to Spark', urlScheme: 'spark://share?type=reel&id={id}&from=vibe', iosScheme: 'spark://share?type=reel&id={id}&from=vibe', androidScheme: 'spark://share?type=reel&id={id}&from=vibe', webFallback: 'https://spark.hdm.com/share?type=reel&id={id}&from=vibe', parameters: [{ name: 'id', required: true, description: 'Reel ID' }], isActive: true },
    { platform: 'vibe', name: 'shareMarketplaceToSpark', description: 'Share a marketplace listing to Spark', urlScheme: 'spark://share?type=listing&id={id}&from=vibe', iosScheme: 'spark://share?type=listing&id={id}&from=vibe', androidScheme: 'spark://share?type=listing&id={id}&from=vibe', webFallback: 'https://spark.hdm.com/share?type=listing&id={id}&from=vibe', parameters: [{ name: 'id', required: true, description: 'Listing ID' }], isActive: true },
    { platform: 'vibe', name: 'inviteViaSpark', description: 'Invite someone to Vibe via Spark broadcast', urlScheme: 'spark://broadcast?text={message}', iosScheme: 'spark://broadcast?text={message}', androidScheme: 'spark://broadcast?text={message}', webFallback: 'https://spark.hdm.com/broadcast?text={message}', parameters: [{ name: 'message', required: true, description: 'Invite message' }], isActive: true },
  ];

  await DeepLink.insertMany(deeplinks);
  console.log(`  ✅ ${deeplinks.length} deeplinks seeded.`);
}

// ====================================================================
// SEED: AI CONFIG
// ====================================================================
async function seedAiConfig(): Promise<void> {
  console.log('\n  🤖 Seeding AI config...');

  const existing = await AiConfig.findOne();
  if (existing) {
    console.log('  ⚠️  AI config already exists. Updating...');
    await AiConfig.findOneAndUpdate({}, { isEnabled: true, baseUrl: 'https://hdmai-server.onrender.com/api/v1', apiKey: 'hdm_spa_3b1a00923453b5c6c25d30e9c20a1df2df4300f8d7a19b78' });
  } else {
    await AiConfig.create({ isEnabled: true, baseUrl: 'https://hdmai-server.onrender.com/api/v1', apiKey: 'hdm_spa_3b1a00923453b5c6c25d30e9c20a1df2df4300f8d7a19b78' });
  }

  console.log('  ✅ AI config seeded.');
}

// ====================================================================
// SEED: ADMIN
// ====================================================================
async function seedAdmin(): Promise<void> {
  console.log('\n  👤 Seeding admin...');

  const existing = await Admin.findOne({ email: 'davismcintyre5@gmail.com' });
  if (existing) {
    console.log('  ⚠️  Admin already exists.');
    return;
  }

  const password = await bcrypt.hash('Hdm@2002', 12);
  await Admin.create({ email: 'davismcintyre5@gmail.com', password, displayName: 'Davix HDM', role: 'super_admin', isActive: true });
  console.log('  ✅ Admin seeded (davismcintyre5@gmail.com).');
}

// ====================================================================
// SEED: LEGAL
// ====================================================================
async function seedLegal(): Promise<void> {
  console.log('\n  📜 Seeding legal documents...');

  const existing = await Legal.countDocuments();
  if (existing > 0) {
    console.log(`  ⚠️  ${existing} legal documents already exist. Skipping.`);
    return;
  }

  const docs = [
    {
      type: 'terms',
      title: 'Terms & Conditions',
      content: `1. ACCEPTANCE OF TERMS
By accessing or using Spark Messenger ("Spark", "we", "us", "our"), you agree to be bound by these Terms & Conditions. If you do not agree to these terms, do not use the service.

2. ELIGIBILITY
You must be at least 13 years of age to use Spark. By using Spark, you represent and warrant that you meet this requirement. If you are under 18, you must have parental consent.

3. ACCOUNT REGISTRATION
3.1 You must provide accurate and complete information when creating your account.
3.2 You are responsible for maintaining the security of your account credentials and for all activities under your account.
3.3 You must notify us immediately of any unauthorized use of your account.
3.4 One person may not maintain more than three accounts without prior authorization.

4. USER CONDUCT
4.1 You agree not to use Spark for any unlawful purpose or in violation of any applicable laws.
4.2 You agree not to harass, abuse, threaten, defame, or impersonate other users.
4.3 You agree not to send spam, unsolicited messages, or engage in phishing activities.
4.4 You agree not to distribute malware, viruses, or any harmful code through Spark.
4.5 You agree not to attempt to gain unauthorized access to Spark's systems or other user accounts.

5. CONTENT
5.1 You retain ownership of the content you send through Spark.
5.2 You grant Spark a limited license to transmit, store, and display your content solely for the purpose of providing the service.
5.3 You are solely responsible for the content you share. Spark does not monitor or control user content.
5.4 Spark reserves the right to remove content that violates these terms or applicable law.

6. PRIVACY
Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information. Our Privacy Policy is incorporated into these Terms by reference.

7. INTELLECTUAL PROPERTY
7.1 Spark, the Spark logo, and all related trademarks are owned by HDM.
7.2 You may not copy, modify, distribute, or reverse engineer any part of the Spark application.
7.3 All rights not expressly granted are reserved.

8. THIRD-PARTY SERVICES
Spark may integrate with third-party services including but not limited to Stripe, M-Pesa, Cloudinary, and Firebase. Your use of such services is subject to their respective terms.

9. TERMINATION
9.1 You may terminate your account at any time by deleting your account in Settings.
9.2 We reserve the right to suspend or terminate your account for violations of these terms, with or without notice.
9.3 Upon termination, your messages and data may be retained for a period as described in our Privacy Policy.

10. DISCLAIMER OF WARRANTIES
Spark is provided "as is" without warranties of any kind, express or implied. We do not guarantee that the service will be uninterrupted, error-free, or completely secure.`,
      version: 1, isPublished: true, publishedAt: new Date(),
    },
    {
      type: 'privacy',
      title: 'Privacy Policy',
      content: `1. INTRODUCTION
This Privacy Policy explains how Spark Messenger ("Spark", "we", "us", "our") collects, uses, stores, and protects your personal information when you use our messaging service.

2. INFORMATION WE COLLECT
2.1 Account Information: Phone number, display name, profile photo, and optional email address.
2.2 Contact Information: If you choose to sync your contacts, we collect phone numbers and names from your device address book.
2.3 Message Data: Messages, media files, and call records are stored in encrypted form.
2.4 Usage Data: We collect anonymous usage statistics including app opens, feature usage, and crash reports.
2.5 Payment Data: If you purchase HDM Verification, payment information is processed by our payment partners and we do not store full card details.

3. HOW WE USE YOUR INFORMATION
3.1 To provide and maintain the Spark messaging service.
3.2 To verify your identity and prevent fraud.
3.3 To show you which of your contacts are also using Spark.
3.4 To process payments for HDM Verification.
3.5 To improve our service through analytics and crash reporting.
3.6 To communicate with you about service updates, security alerts, and support.

4. MESSAGE ENCRYPTION
4.1 All messages sent through Spark are end-to-end encrypted using AES-256-GCM encryption.
4.2 Encryption keys are stored on your devices. Spark cannot read your messages.
4.3 Media files are encrypted during transmission and stored securely.

5. DATA STORAGE
5.1 Messages are stored on our servers in encrypted form.
5.2 Media files are stored on Cloudinary servers with secure access controls.
5.3 We retain your data for as long as your account is active or as needed to provide the service.
5.4 Deleted messages may remain in backups for up to 90 days.

6. DATA SHARING
6.1 We do not sell, trade, or rent your personal information to third parties.
6.2 We may share anonymized, aggregated data for analytical purposes.
6.3 We may disclose information if required by law, court order, or government regulation.
6.4 Payment processing is handled by Stripe and Safaricom (M-Pesa) under their respective privacy policies.

7. YOUR RIGHTS
7.1 You can access, update, or delete your account information in Settings.
7.2 You can delete your entire account, which removes your personal data from our active systems.
7.3 You can request a copy of your data by contacting support.
7.4 You can opt out of promotional communications in Settings.

8. COOKIES AND TRACKING
8.1 Spark Web uses essential cookies for authentication and preferences.
8.2 We do not use third-party tracking cookies.
8.3 Please review our Cookie Policy for more details.

9. SECURITY
9.1 We implement industry-standard security measures including encryption, access controls, and regular security audits.
9.2 We use JWT tokens for authentication and session management.
9.3 Login alerts notify you of new device access to your account.

10. CONTACT
If you have questions about this Privacy Policy, please contact us at davismcintyre5@gmail.com or through the Help section in the app.`,
      version: 1, isPublished: true, publishedAt: new Date(),
    },
    {
      type: 'cookies',
      title: 'Cookie Policy',
      content: `1. WHAT ARE COOKIES
Cookies are small text files stored on your device when you visit Spark Web. They help us recognize your device, remember your preferences, and improve your experience.

2. TYPES OF COOKIES WE USE
2.1 Essential Cookies: Required for the service to function including authentication tokens and session management.
2.2 Preference Cookies: Remember your settings such as theme, language, and display preferences.
2.3 Security Cookies: Help us detect and prevent security threats including unauthorized access attempts.
2.4 Analytics Cookies: Collect anonymous data about how you use Spark to help us improve the service.

3. SPECIFIC COOKIES
3.1 spark_access_token: Stores your authentication token for API requests. Duration: 7 days.
3.2 spark_refresh_token: Used to obtain new access tokens without re-login. Duration: 30 days.
3.3 spark_theme: Remembers your selected theme preference. Duration: Persistent.
3.4 spark_user: Stores basic profile information for faster loading. Duration: Session.

4. THIRD-PARTY COOKIES
4.1 Spark does not use third-party advertising cookies.
4.2 Cloudinary may use cookies for media delivery optimization.
4.3 Stripe may use cookies when processing payments on the Spark Web.

5. MANAGING COOKIES
5.1 You can disable cookies in your browser settings.
5.2 Essential cookies cannot be disabled as they are required for the service to function.
5.3 Disabling preference cookies will reset your settings to defaults.
5.4 You can clear all Spark cookies by logging out and clearing browser data.

6. DATA COLLECTED VIA COOKIES
6.1 Authentication status and session information.
6.2 Theme and display preferences.
6.3 Anonymous usage patterns for service improvement.
6.4 No personal messages or media are stored in cookies.

7. COOKIE DURATION
7.1 Session cookies expire when you close your browser.
7.2 Persistent cookies remain for their set duration or until manually cleared.
7.3 Authentication cookies auto-refresh when you use the service.

8. YOUR CONSENT
8.1 By using Spark Web, you consent to the use of essential cookies.
8.2 For non-essential cookies, you may opt out through browser settings.
8.3 We do not require cookie consent banners as we only use essential and functional cookies.

9. UPDATES TO THIS POLICY
9.1 We may update this Cookie Policy from time to time.
9.2 Changes will be posted in the app and on our website.
9.3 Continued use of Spark after changes constitutes acceptance.

10. CONTACT
For questions about cookies, contact us at davismcintyre5@gmail.com.`,
      version: 1, isPublished: true, publishedAt: new Date(),
    },
    {
      type: 'ads_preferences',
      title: 'Ads Preferences',
      content: `1. ADVERTISING POLICY
Spark Messenger does not display third-party advertisements in the messaging service. Your conversations remain ad-free.

2. PROMOTIONAL COMMUNICATIONS
2.1 We may occasionally send you information about new Spark features, updates, and HDM services.
2.2 Promotional messages are sent via in-app notifications or to your registered email.
2.3 You can opt out of promotional communications in Settings at any time.

3. DATA USAGE
3.1 We do not use your personal messages, contacts, or media for advertising purposes.
3.2 We do not build advertising profiles based on your conversations.
3.3 Anonymized, aggregated usage data may be used for service improvement analytics.

4. HDM VERIFIED PROMOTION
4.1 HDM Verified is our premium verification service (blue tick).
4.2 Information about HDM Verified plans and pricing is available in the app under Settings.
4.3 Verified users may be featured in Spark's public directory if they opt in.

5. AFFILIATE LINKS
5.1 Spark does not currently include affiliate links or sponsored content.
5.2 If this changes in the future, users will be notified and given opt-out options.

6. THIRD-PARTY ADVERTISING
6.1 We do not allow third-party advertising on Spark.
6.2 We do not share your data with advertising networks or data brokers.
6.3 Our business model is based on the HDM Verified subscription service, not advertising.

7. YOUR CHOICES
7.1 You can opt out of all non-essential communications in Settings.
7.2 You can delete your account at any time to stop all data collection.
7.3 You control what information appears on your public profile.

8. TRANSPARENCY
8.1 We are committed to being transparent about how we fund our service.
8.2 Spark is funded through HDM Verified subscriptions, not through selling user data.
8.3 We will clearly communicate any changes to our monetization model.

9. FUTURE ADVERTISING
9.1 If Spark ever introduces advertising, users will be given advance notice.
9.2 Any future advertising will be clearly labeled and separated from messages.
9.3 Users will have the ability to control ad preferences and opt out.

10. CONTACT
For questions about our advertising policies, contact davismcintyre5@gmail.com.`,
      version: 1, isPublished: true, publishedAt: new Date(),
    },
  ];

  await Legal.insertMany(docs);
  console.log('  ✅ 4 legal documents seeded (10 sections each).');
}

// ====================================================================
// SEED: USERS
// ====================================================================
async function seedUsers(): Promise<void> {
  console.log('\n  👥 Seeding 5 sample users with chats...');

  const existingCount = await User.countDocuments({ phone: /^\+25470000000/ });
  if (existingCount > 0) {
    console.log('  ⚠️  Sample users already exist. Clearing...');
    const sampleUsers = await User.find({ phone: /^\+25470000000/ }).select('_id');
    const sampleIds = sampleUsers.map((u) => u._id);
    await Chat.deleteMany({ participants: { $in: sampleIds } });
    await Message.deleteMany({ senderId: { $in: sampleIds } });
    await Contact.deleteMany({ userId: { $in: sampleIds } });
    await User.deleteMany({ _id: { $in: sampleIds } });
  }

  const users = await User.create([
    { phone: '+254700000001', displayName: 'Alice Wanjiku', bio: 'Software Developer | HDM Family', isPhoneVerified: true, isHdmVerified: true, hdmVerifiedPlan: 'yearly', hdmVerifiedExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    { phone: '+254700000002', displayName: 'Bob Ochieng', bio: 'Designer & Creator', isPhoneVerified: true, isHdmVerified: false },
    { phone: '+254700000003', displayName: 'Carol Muthoni', bio: 'Student | Explorer', isPhoneVerified: true, isHdmVerified: true, hdmVerifiedPlan: 'monthly', hdmVerifiedExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    { phone: '+254700000004', displayName: 'David Kimani', bio: 'Photographer', isPhoneVerified: true, isHdmVerified: false },
    { phone: '+254700000005', displayName: 'Eve Atieno', bio: 'Entrepreneur | HDM Verified', isPhoneVerified: true, isHdmVerified: true, hdmVerifiedPlan: 'permanent', hdmVerifiedExpiresAt: null },
  ]);

  for (const user of users) {
    const otherUsers = users.filter((u) => u._id.toString() !== user._id.toString());
    const contacts = otherUsers.map((u) => ({
      userId: user._id, contactPhone: u.phone, contactName: u.displayName,
      contactUserId: u._id, isOnSpark: true, isSynced: true,
    }));
    await Contact.insertMany(contacts);
  }

  const alice = users[0];
  const chatMessages: any[] = [];

  for (let i = 1; i < users.length; i++) {
    const otherUser = users[i];
    const chat = await Chat.create({
      participants: [alice._id, otherUser._id], isGroup: false, createdBy: alice._id,
      lastMessage: { content: 'Hey! Welcome to Spark!', senderId: alice._id, messageType: 'text', createdAt: new Date() },
    });

    chatMessages.push(
      { chatId: chat._id, senderId: alice._id, content: `Hey ${otherUser.displayName}! Welcome to Spark!`, messageType: 'text', status: 'read', readBy: [otherUser._id] },
      { chatId: chat._id, senderId: otherUser._id, content: 'Thanks Alice! This app is amazing!', messageType: 'text', status: 'read', readBy: [alice._id] },
      { chatId: chat._id, senderId: alice._id, content: 'Right? The privacy features are next level!', messageType: 'text', status: 'delivered', deliveredTo: [otherUser._id] },
      { chatId: chat._id, senderId: otherUser._id, content: 'I love the ghost mode already', messageType: 'text', status: 'sent' },
    );
  }

  await Message.insertMany(chatMessages);

  const groupChat = await Chat.create({
    participants: users.map((u) => u._id), isGroup: true, groupName: 'HDM Family',
    groupDescription: 'Welcome to the HDM Family group!', groupAdmins: [alice._id], createdBy: alice._id,
    lastMessage: { content: 'Welcome everyone to HDM Family!', senderId: alice._id, messageType: 'text', createdAt: new Date() },
  });

  await Group.create({
    chatId: groupChat._id, name: 'HDM Family', description: 'Welcome to the HDM Family group!',
    ownerId: alice._id, admins: [alice._id], members: users.map((u) => u._id), memberCount: users.length, inviteLink: 'hdmfamily2024',
  });

  await Message.insertMany([
    { chatId: groupChat._id, senderId: alice._id, content: 'Welcome everyone to HDM Family!', messageType: 'text', status: 'read', readBy: users.slice(1).map((u) => u._id) },
    { chatId: groupChat._id, senderId: users[1]._id, content: 'Glad to be here!', messageType: 'text', status: 'read', readBy: [alice._id] },
    { chatId: groupChat._id, senderId: users[2]._id, content: 'This group is going to be awesome!', messageType: 'text', status: 'delivered' },
  ]);

  console.log('  ✅ Sample users seeded:');
  users.forEach((u, i) => console.log(`     ${i + 1}. ${u.displayName} — ${u.phone} ${u.isHdmVerified ? '✅' : ''}`));
  console.log(`     Group: HDM Family (${users.length} members)`);
  console.log(`     Messages: ${chatMessages.length + 3} total`);
}

// ====================================================================
// SEED: ALL
// ====================================================================
async function seedAll(): Promise<void> {
  console.log('\n  🌱 Seeding ALL data...\n');
  await seedSettings();
  await seedDeeplinks();
  await seedAiConfig();
  await seedAdmin();
  await seedLegal();
  await seedUsers();
  console.log('\n  ✅ All seed data created successfully!');
}

// ====================================================================
// CLEAR
// ====================================================================
async function clearAll(): Promise<void> {
  console.log('\n  🗑️  Clearing all seed data...');
  const confirm = await question('  ⚠️  This will delete ALL data. Type "CLEAR" to confirm: ');
  if (confirm !== 'CLEAR') { console.log('  Cancelled.'); return; }

  await Message.deleteMany({});
  await Chat.deleteMany({});
  await Group.deleteMany({});
  await Contact.deleteMany({});
  await Status.deleteMany({});
  await User.deleteMany({});
  await Settings.deleteMany({});
  await DeepLink.deleteMany({});
  await AiConfig.deleteMany({});
  await Legal.deleteMany({});
  await Admin.deleteMany({});

  console.log('  ✅ All seed data cleared.');
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
      case '1': await seedAll(); break;
      case '2': await seedSettings(); break;
      case '3': await seedDeeplinks(); break;
      case '4': await seedAiConfig(); break;
      case '5': await seedAdmin(); break;
      case '6': await seedLegal(); break;
      case '7': await seedUsers(); break;
      case '8': await clearAll(); break;
      case '0': console.log('\n  👋 Goodbye!\n'); await disconnectDB(); rl.close(); process.exit(0);
      default: console.log('\n  ❌ Invalid choice. Try again.');
    }

    if (choice !== '0') await question('\n  Press Enter to continue...');
  }
}

main().catch(async (error) => {
  console.error('Fatal error:', error);
  await disconnectDB();
  rl.close();
  process.exit(1);
});