import User from '../../models/client/User';
import Message from '../../models/client/Message';
import Chat from '../../models/client/Chat';
import Group from '../../models/client/Group';
import Call from '../../models/client/Call';
import Status from '../../models/client/Status';
import Payment from '../../models/client/Payment';
import PendingActivation from '../../models/client/PendingActivation';
import Report from '../../models/admin/Report';
import Ticket from '../../models/admin/Ticket';
import Ban from '../../models/admin/Ban';
import { logger } from '../../utils/logger';

export async function getDashboardStats(): Promise<any> {
  try {
    const [
      totalUsers,
      activeUsers,
      totalMessages,
      todayMessages,
      totalGroups,
      totalCalls,
      totalPayments,
      pendingActivations,
      openReports,
      openTickets,
      activeBans,
    ] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      User.countDocuments({ status: 'online' }),
      Message.countDocuments({ deletedForEveryone: false }),
      Message.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        deletedForEveryone: false,
      }),
      Group.countDocuments({ isDeleted: false }),
      Call.countDocuments({ isDeleted: false }),
      Payment.countDocuments({ status: 'completed' }),
      PendingActivation.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: { $in: ['submitted', 'under_review'] } }),
      Ticket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      Ban.countDocuments({ isActive: true }),
    ]);

    const messageVolumeByDay = await Message.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          deletedForEveryone: false,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const userGrowthByDay = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revenueByPlan = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$plan',
          totalRevenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      overview: {
        totalUsers,
        activeUsers,
        totalMessages,
        todayMessages,
        totalGroups,
        totalCalls,
        totalPayments,
        pendingActivations,
        openReports,
        openTickets,
        activeBans,
      },
      charts: {
        messageVolumeByDay,
        userGrowthByDay,
        revenueByPlan,
      },
    };
  } catch (error: any) {
    logger.error('Dashboard stats failed', { error: error.message });
    throw error;
  }
}

export async function getRecentActivity(limit: number = 20): Promise<any[]> {
  const recentUsers = await User.find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('displayName phone createdAt')
    .lean();

  const recentReports = await Report.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('reporterId', 'displayName')
    .select('targetType reason status createdAt')
    .lean();

  const recentPayments = await Payment.find({ status: 'completed' })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('userId', 'displayName phone')
    .select('plan amount paymentMethod createdAt')
    .lean();

  return { recentUsers, recentReports, recentPayments };
}