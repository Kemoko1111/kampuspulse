-- 004: Tasks (Y3 Adwuma)
CREATE TABLE public.tasks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poster_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assignee_id      UUID REFERENCES public.profiles(id),
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  category         TEXT NOT NULL CHECK (category IN ('academic','delivery','printing','food','laundry','tech','design','event','other')),
  reward           NUMERIC(10,2) NOT NULL CHECK (reward >= 5),
  deadline         TIMESTAMPTZ NOT NULL,
  location         TEXT,
  status           TEXT NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','assigned','in_progress','completed','cancelled','disputed')),
  images           TEXT[] DEFAULT '{}',
  is_urgent        BOOLEAN DEFAULT FALSE,
  total_applicants INT DEFAULT 0,
  payment_reference TEXT,
  payment_status   TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded','escrowed')),
  deleted_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.task_applications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id         UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  applicant_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  cover_message   TEXT,
  proposed_price  NUMERIC(10,2),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','withdrawn')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, applicant_id)
);

CREATE INDEX tasks_poster_idx ON public.tasks(poster_id);
CREATE INDEX tasks_status_idx ON public.tasks(status);
CREATE INDEX task_applications_task_idx ON public.task_applications(task_id);
