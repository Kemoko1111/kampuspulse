-- Fix task posting RLS (run in Supabase SQL Editor)

DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
CREATE POLICY "tasks_insert" ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    poster_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (
    poster_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL)
    OR assignee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL)
  )
  WITH CHECK (
    poster_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL)
    OR assignee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL)
  );

DROP POLICY IF EXISTS "task_apps_insert" ON public.task_applications;
CREATE POLICY "task_apps_insert" ON public.task_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    applicant_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );
