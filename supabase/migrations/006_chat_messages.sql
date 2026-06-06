-- 006: Chat and messages
CREATE TABLE public.chat_rooms (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participants    UUID[] NOT NULL,
  last_message_at TIMESTAMPTZ,
  is_group        BOOLEAN DEFAULT FALSE,
  group_name      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id     UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id   UUID REFERENCES public.profiles(id) NOT NULL,
  content     TEXT NOT NULL,
  type        TEXT DEFAULT 'text' CHECK (type IN ('text','image','file','system')),
  file_url    TEXT,
  is_read     BOOLEAN DEFAULT FALSE,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.typing_indicators (
  room_id     UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  profile_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  is_typing   BOOLEAN DEFAULT FALSE,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, profile_id)
);

CREATE TABLE public.user_presence (
  profile_id  UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_online   BOOLEAN DEFAULT FALSE,
  last_seen   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX messages_room_idx ON public.messages(room_id, created_at DESC);
