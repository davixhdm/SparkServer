import Report from '../../models/admin/Report';
import ModerationLog from '../../models/admin/ModerationLog';
import { logger } from '../../utils/logger';
import { NotFoundError } from '../../utils/errors';

export async function getReports(
  page: number = 1,
  limit: number = 20,
  filters?: {
    status?: string;
    targetType?: string;
    reason?: string;
  },
): Promise<any> {
  const skip = (page - 1) * limit;
  const query: any = {};

  if (filters?.status) query.status = filters.status;
  if (filters?.targetType) query.targetType = filters.targetType;
  if (filters?.reason) query.reason = filters.reason;

  const reports = await Report.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('reporterId', 'displayName phone')
    .populate('assignedTo', 'displayName email')
    .lean();

  const total = await Report.countDocuments(query);

  return { reports, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getReportDetail(reportId: string): Promise<any> {
  const report = await Report.findById(reportId)
    .populate('reporterId', 'displayName phone avatar')
    .populate('assignedTo', 'displayName email')
    .populate('resolvedBy', 'displayName')
    .lean();

  if (!report) throw new NotFoundError('Report not found');
  return report;
}

export async function assignReport(reportId: string, adminId: string): Promise<any> {
  const report = await Report.findByIdAndUpdate(
    reportId,
    {
      assignedTo: adminId,
      status: 'under_review',
    },
    { new: true },
  );

  if (!report) throw new NotFoundError('Report not found');
  return report;
}

export async function resolveReport(
  reportId: string,
  adminId: string,
  resolution: string,
  actionTaken: 'warning' | 'content_removed' | 'user_banned' | 'dismissed',
  ipAddress?: string,
): Promise<any> {
  const report = await Report.findByIdAndUpdate(
    reportId,
    {
      status: 'resolved',
      resolution,
      actionTaken,
      resolvedBy: adminId,
      resolvedAt: new Date(),
    },
    { new: true },
  );

  if (!report) throw new NotFoundError('Report not found');

  await ModerationLog.create({
    adminId,
    action: 'report_resolved',
    targetType: 'report',
    targetId: reportId,
    details: `${actionTaken}: ${resolution}`,
    ipAddress: ipAddress || '',
  });

  return report;
}

export async function dismissReport(
  reportId: string,
  adminId: string,
  reason?: string,
): Promise<any> {
  const report = await Report.findByIdAndUpdate(
    reportId,
    {
      status: 'dismissed',
      resolution: reason || 'Dismissed by admin',
      actionTaken: 'dismissed',
      resolvedBy: adminId,
      resolvedAt: new Date(),
    },
    { new: true },
  );

  if (!report) throw new NotFoundError('Report not found');

  await ModerationLog.create({
    adminId,
    action: 'report_dismissed',
    targetType: 'report',
    targetId: reportId,
    details: reason || 'Dismissed',
  });

  return report;
}