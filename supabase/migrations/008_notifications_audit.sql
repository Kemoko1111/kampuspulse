-- 008: Notifications, audit logs, FCM tokens
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  data        JSONB,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX notifications_user_idx ON public.notifications(user_id, is_read, created_at DESC);

CREATE TABLE public.fcm_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  token       TEXT NOT NULL,
  device_info TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, token)
);

CREATE TABLE public.admin_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id        UUID REFERENCES public.profiles(id) NOT NULL,
  action          TEXT NOT NULL,
  resource_type   TEXT NOT NULL,
  resource_id     UUID,
  old_data        JSONB,
  new_data        JSONB,
  ip_address      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name  TEXT NOT NULL,
  record_id   UUID NOT NULL,
  action      TEXT NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  old_data    JSONB,
  new_data    JSONB,
  actor_id    UUID REFERENCES public.profiles(id),
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX audit_logs_table_idx ON public.audit_logs(table_name, record_id);
CREATE INDEX audit_logs_actor_idx ON public.audit_logs(actor_id);
