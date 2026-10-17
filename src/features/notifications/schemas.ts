import { z } from 'zod';

export const notificationCursorSchema = z
  .object({
    beforeCreatedAt: z.string().datetime({ offset: true }).optional(),
    beforeId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(30).default(15),
    unreadOnly: z
      .enum(['true', 'false', '1', '0'])
      .optional()
      .transform((v) => v === 'true' || v === '1'),
  })
  .refine(
    (val) =>
      (val.beforeCreatedAt === undefined && val.beforeId === undefined) ||
      (val.beforeCreatedAt !== undefined && val.beforeId !== undefined),
    {
      message: 'Cursor requer beforeCreatedAt e beforeId juntos.',
    },
  );

export const markNotificationsReadSchema = z
  .object({
    ids: z.array(z.string().uuid()).min(1).max(100).optional(),
    before: z.string().datetime({ offset: true }).optional(),
  })
  .refine((val) => Boolean(val.ids?.length) || Boolean(val.before), {
    message: 'Informe ids ou before para marcar notificações como lidas.',
  });

export const notificationPreferencesSchema = z.object({
  replies: z.boolean(),
  mentions: z.boolean(),
  meetingReminders: z.boolean(),
  channelActivity: z.boolean().default(false),
});

export type NotificationCursorInput = z.infer<typeof notificationCursorSchema>;
export type MarkNotificationsReadInput = z.infer<typeof markNotificationsReadSchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
