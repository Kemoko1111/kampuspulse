import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { NotificationRepository } from "@/lib/repositories/notification.repository";
import { sendPushNotification } from "@/lib/firebase/admin";

export class NotificationService {
  private notifRepo: NotificationRepository;

  constructor(private supabase: TypedSupabaseClient) {
    this.notifRepo = new NotificationRepository(supabase);
  }

  async notify(params: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }) {
    const { data: notification, error } = await this.notifRepo.create({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      data: params.data,
    });

    if (error) throw error;

    const { data: tokens } = await this.supabase
      .from("fcm_tokens")
      .select("token")
      .eq("profile_id", params.userId);

    if (tokens?.length) {
      // Respect the recipient's push preference (Settings → Push Notifications).
      // The in-app row above is always created; only the device push is gated.
      // Defaults to on when unset.
      const { data: prefRow } = await this.supabase
        .from("profiles")
        .select("notification_preferences")
        .eq("id", params.userId)
        .maybeSingle();
      const prefs = (prefRow as { notification_preferences?: { push?: boolean } } | null)?.notification_preferences;
      const pushEnabled = prefs?.push !== false;

      if (pushEnabled) {
        const stringData: Record<string, string> = {};
        if (params.data) {
          for (const [k, v] of Object.entries(params.data)) {
            stringData[k] = String(v);
          }
        }
        await sendPushNotification(
          (tokens as { token: string }[]).map((t) => t.token),
          params.title,
          params.body,
          stringData
        );
      }
    }

    return notification;
  }
}
