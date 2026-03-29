-- Verify and set up RLS policies for Rent and Drive
-- Run this in Supabase SQL Editor

-- ============================================
-- BOOKINGS TABLE RLS
-- ============================================
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings (as renter)
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = renter_id);

-- Hosts can view bookings for their vehicles
DROP POLICY IF EXISTS "Hosts can view bookings for their vehicles" ON bookings;
CREATE POLICY "Hosts can view bookings for their vehicles" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vehicles 
      WHERE vehicles.id = bookings.vehicle_id 
      AND vehicles.host_id = auth.uid()
    )
  );

-- Users can create bookings
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = renter_id);

-- Users can update their own pending bookings
DROP POLICY IF EXISTS "Users can update own pending bookings" ON bookings;
CREATE POLICY "Users can update own pending bookings" ON bookings
  FOR UPDATE USING (
    auth.uid() = renter_id 
    AND status IN ('pending', 'confirmed')
  );

-- ============================================
-- VEHICLES TABLE RLS
-- ============================================
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Anyone can view active vehicles
DROP POLICY IF EXISTS "Anyone can view active vehicles" ON vehicles;
CREATE POLICY "Anyone can view active vehicles" ON vehicles
  FOR SELECT USING (status = 'active' OR host_id = auth.uid());

-- Hosts can insert their own vehicles
DROP POLICY IF EXISTS "Hosts can insert own vehicles" ON vehicles;
CREATE POLICY "Hosts can insert own vehicles" ON vehicles
  FOR INSERT WITH CHECK (auth.uid() = host_id);

-- Hosts can update their own vehicles
DROP POLICY IF EXISTS "Hosts can update own vehicles" ON vehicles;
CREATE POLICY "Hosts can update own vehicles" ON vehicles
  FOR UPDATE USING (auth.uid() = host_id);

-- ============================================
-- USER_CREDITS TABLE RLS
-- ============================================
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own credits" ON user_credits;
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- WISHLISTS TABLE RLS
-- ============================================
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own wishlists" ON wishlists;
CREATE POLICY "Users can manage own wishlists" ON wishlists
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- NOTIFICATIONS TABLE RLS
-- ============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- REVIEWS TABLE RLS
-- ============================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

-- Users can create reviews for completed bookings
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = reviews.booking_id 
      AND bookings.renter_id = auth.uid()
      AND bookings.status = 'completed'
    )
  );

-- ============================================
-- PROFILES TABLE RLS
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view all profiles (for host info display)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Users can update own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- VERIFY RLS IS ENABLED
-- ============================================
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('bookings', 'vehicles', 'user_credits', 'wishlists', 'notifications', 'reviews', 'profiles')
ORDER BY tablename;
