-- Ride Concierge table for Lyft/Uber integration
-- This enables the premium differentiator feature

CREATE TABLE IF NOT EXISTS public.ride_concierge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  ride_type TEXT NOT NULL CHECK (ride_type IN ('lyft', 'uber')),
  ride_direction TEXT NOT NULL CHECK (ride_direction IN ('pickup', 'dropoff')),
  rider_name TEXT NOT NULL,
  rider_phone TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  ride_status TEXT NOT NULL DEFAULT 'scheduled' CHECK (ride_status IN ('scheduled', 'dispatched', 'en_route', 'arrived', 'completed', 'cancelled', 'failed')),
  external_ride_id TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  vehicle_description TEXT,
  eta_minutes INTEGER,
  cost_cents INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ride_concierge ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Renters can view their own rides" ON public.ride_concierge
  FOR SELECT USING (
    booking_id IN (SELECT id FROM public.bookings WHERE renter_id = auth.uid())
  );

CREATE POLICY "Hosts can view rides for their bookings" ON public.ride_concierge
  FOR SELECT USING (
    booking_id IN (SELECT id FROM public.bookings WHERE host_id = auth.uid())
  );

CREATE POLICY "Admins can manage all rides" ON public.ride_concierge
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Service role can manage all rides (for API routes)
CREATE POLICY "Service role full access" ON public.ride_concierge
  FOR ALL USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ride_concierge_booking ON public.ride_concierge(booking_id);
CREATE INDEX IF NOT EXISTS idx_ride_concierge_status ON public.ride_concierge(ride_status);
CREATE INDEX IF NOT EXISTS idx_ride_concierge_scheduled ON public.ride_concierge(scheduled_time);

-- Add concierge_enabled flag to bookings if not exists
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS concierge_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS concierge_pickup_requested BOOLEAN DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS concierge_dropoff_requested BOOLEAN DEFAULT false;
