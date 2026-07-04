-- Enable Supabase Realtime for KampusPulse tables
-- Run this in SQL Editor (Dashboard → SQL → New query)

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
-- rider_profiles: needed for the passenger's live-tracking map to receive the
-- rider's moving location (the track page subscribes to rider_profiles
-- UPDATEs; without this the dot was frozen at its first fetched position).
ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_profiles;
