-- 005: Rides and deliveries (EzzyRide)
CREATE TABLE public.rides (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passenger_id          UUID REFERENCES public.profiles(id) NOT NULL,
  rider_id              UUID REFERENCES public.profiles(id),
  pickup_address        TEXT NOT NULL,
  pickup_lat            NUMERIC(10,6),
  pickup_lng            NUMERIC(10,6),
  destination_address   TEXT NOT NULL,
  destination_lat       NUMERIC(10,6),
  destination_lng       NUMERIC(10,6),
  estimated_fare        NUMERIC(10,2),
  actual_fare           NUMERIC(10,2),
  distance_km           NUMERIC(6,2),
  duration_minutes      INT,
  status                TEXT NOT NULL DEFAULT 'searching'
                        CHECK (status IN ('searching','accepted','en_route','arrived','in_progress','completed','cancelled')),
  payment_method        TEXT,
  payment_status        TEXT DEFAULT 'pending',
  payment_reference     TEXT,
  rating                NUMERIC(3,2),
  notes                 TEXT,
  deleted_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.deliveries (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id             UUID REFERENCES public.profiles(id) NOT NULL,
  rider_id              UUID REFERENCES public.profiles(id),
  delivery_type         TEXT NOT NULL CHECK (delivery_type IN ('food','package','marketplace','document','student_to_student')),
  pickup_address        TEXT NOT NULL,
  pickup_lat            NUMERIC(10,6),
  pickup_lng              NUMERIC(10,6),
  delivery_address      TEXT NOT NULL,
  delivery_lat          NUMERIC(10,6),
  delivery_lng          NUMERIC(10,6),
  package_description   TEXT,
  package_size          TEXT DEFAULT 'small' CHECK (package_size IN ('small','medium','large')),
  estimated_fee         NUMERIC(10,2),
  actual_fee            NUMERIC(10,2),
  distance_km           NUMERIC(6,2),
  status                TEXT NOT NULL DEFAULT 'searching'
                        CHECK (status IN ('searching','accepted','picked_up','in_transit','delivered','cancelled')),
  tracking_code         TEXT UNIQUE,
  payment_method        TEXT,
  payment_status        TEXT DEFAULT 'pending',
  payment_reference     TEXT,
  special_instructions  TEXT,
  deleted_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.rider_profiles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  vehicle_type     TEXT NOT NULL CHECK (vehicle_type IN ('bicycle','motorbike','car')),
  vehicle_number   TEXT,
  license_number   TEXT,
  document_urls    TEXT[] DEFAULT '{}',
  is_verified      BOOLEAN DEFAULT FALSE,
  is_available     BOOLEAN DEFAULT FALSE,
  current_lat      NUMERIC(10,6),
  current_lng      NUMERIC(10,6),
  rating           NUMERIC(3,2) DEFAULT 0.0,
  total_trips      INT DEFAULT 0,
  total_deliveries INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX rides_passenger_idx ON public.rides(passenger_id);
CREATE INDEX rides_rider_idx ON public.rides(rider_id);
CREATE INDEX rides_status_idx ON public.rides(status);
CREATE INDEX deliveries_sender_idx ON public.deliveries(sender_id);
CREATE INDEX rider_profiles_available_idx ON public.rider_profiles(is_available) WHERE is_available = true;
