-- Rent and Drive LLC - Row Level Security Policies Migration

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vin_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE nhtsa_recalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rd_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rd_agent_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE morning_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE renter_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE lockboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lockbox_access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE curfews ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_concierge ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_lab_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE renter_road_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE renter_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE renter_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_blocked_renters ENABLE ROW LEVEL SECURITY;

-- ============ PROFILES POLICIES ============
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============ VEHICLES POLICIES ============
CREATE POLICY "Active vehicles are viewable by everyone" ON vehicles
  FOR SELECT USING (status = 'active' AND is_approved = true);

CREATE POLICY "Hosts can view all their vehicles" ON vehicles
  FOR SELECT USING (auth.uid() = host_id);

CREATE POLICY "Hosts can insert vehicles" ON vehicles
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update own vehicles" ON vehicles
  FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete own draft vehicles" ON vehicles
  FOR DELETE USING (auth.uid() = host_id AND status = 'draft');

-- ============ BOOKINGS POLICIES ============
CREATE POLICY "Users can view own bookings as renter" ON bookings
  FOR SELECT USING (auth.uid() = renter_id);

CREATE POLICY "Users can view own bookings as host" ON bookings
  FOR SELECT USING (auth.uid() = host_id);

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Renters can update own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = renter_id);

CREATE POLICY "Hosts can update bookings for their vehicles" ON bookings
  FOR UPDATE USING (auth.uid() = host_id);

-- ============ PAYMENTS POLICIES ============
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- ============ REVIEWS POLICIES ============
CREATE POLICY "Public reviews are viewable by everyone" ON reviews
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view reviews they wrote" ON reviews
  FOR SELECT USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can view reviews about them" ON reviews
  FOR SELECT USING (auth.uid() = reviewee_id);

CREATE POLICY "Users can create reviews for their bookings" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewees can respond to reviews" ON reviews
  FOR UPDATE USING (auth.uid() = reviewee_id);

-- ============ USER CREDITS POLICIES ============
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

-- ============ WISHLISTS POLICIES ============
CREATE POLICY "Users can view own wishlists" ON wishlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wishlists" ON wishlists
  FOR ALL USING (auth.uid() = user_id);

-- ============ NOTIFICATIONS POLICIES ============
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============ DRIVER VERIFICATIONS POLICIES ============
CREATE POLICY "Users can view own verification" ON driver_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own verification" ON driver_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending verification" ON driver_verifications
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- ============ VIN REPORTS POLICIES ============
CREATE POLICY "Anyone can view VIN reports for active vehicles" ON vin_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vehicles 
      WHERE vehicles.id = vin_reports.vehicle_id 
      AND vehicles.status = 'active'
    )
  );

CREATE POLICY "Hosts can view VIN reports for their vehicles" ON vin_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vehicles 
      WHERE vehicles.id = vin_reports.vehicle_id 
      AND vehicles.host_id = auth.uid()
    )
  );

-- ============ NHTSA RECALLS POLICIES ============
CREATE POLICY "Anyone can view recalls for active vehicles" ON nhtsa_recalls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vehicles 
      WHERE vehicles.id = nhtsa_recalls.vehicle_id 
      AND vehicles.status = 'active'
    )
  );

-- ============ INSPECTIONS POLICIES ============
CREATE POLICY "Users can view inspections for their bookings" ON inspections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = inspections.booking_id 
      AND (bookings.renter_id = auth.uid() OR bookings.host_id = auth.uid())
    )
  );

CREATE POLICY "Users can create inspections" ON inspections
  FOR INSERT WITH CHECK (auth.uid() = inspector_id);

-- ============ RD AGENTS POLICIES ============
CREATE POLICY "Users can view own agents" ON rd_agents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own agents" ON rd_agents
  FOR UPDATE USING (auth.uid() = user_id);

-- ============ RD AGENT LOG POLICIES ============
CREATE POLICY "Users can view own agent logs" ON rd_agent_log
  FOR SELECT USING (auth.uid() = user_id);

-- ============ MORNING BRIEFS POLICIES ============
CREATE POLICY "Users can view own briefs" ON morning_briefs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own briefs" ON morning_briefs
  FOR UPDATE USING (auth.uid() = user_id);

-- ============ PRICING HISTORY POLICIES ============
CREATE POLICY "Hosts can view pricing for their vehicles" ON pricing_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vehicles 
      WHERE vehicles.id = pricing_history.vehicle_id 
      AND vehicles.host_id = auth.uid()
    )
  );

-- ============ FLEET TELEMETRY POLICIES ============
CREATE POLICY "Hosts can view telemetry for their vehicles" ON fleet_telemetry
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vehicles 
      WHERE vehicles.id = fleet_telemetry.vehicle_id 
      AND vehicles.host_id = auth.uid()
    )
  );

-- ============ FLEET ALERTS POLICIES ============
CREATE POLICY "Hosts can view alerts for their vehicles" ON fleet_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vehicles 
      WHERE vehicles.id = fleet_alerts.vehicle_id 
      AND vehicles.host_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can update alerts for their vehicles" ON fleet_alerts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM vehicles 
      WHERE vehicles.id = fleet_alerts.vehicle_id 
      AND vehicles.host_id = auth.uid()
    )
  );

-- ============ TRIP RECORDS POLICIES ============
CREATE POLICY "Hosts can view trip records for their vehicles" ON trip_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vehicles 
      WHERE vehicles.id = trip_records.vehicle_id 
      AND vehicles.host_id = auth.uid()
    )
  );

-- ============ LOCKBOXES POLICIES ============
CREATE POLICY "Hosts can manage own lockboxes" ON lockboxes
  FOR ALL USING (auth.uid() = host_id);

-- ============ LOCKBOX ACCESS CODES POLICIES ============
CREATE POLICY "Users can view codes for their bookings" ON lockbox_access_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Hosts can view codes for their lockboxes" ON lockbox_access_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lockboxes 
      WHERE lockboxes.id = lockbox_access_codes.lockbox_id 
      AND lockboxes.host_id = auth.uid()
    )
  );

-- ============ GEOFENCES & CURFEWS POLICIES ============
CREATE POLICY "Hosts can manage own geofences" ON geofences
  FOR ALL USING (auth.uid() = host_id);

CREATE POLICY "Hosts can manage own curfews" ON curfews
  FOR ALL USING (auth.uid() = host_id);

-- ============ INSURANCE POLICIES ============
CREATE POLICY "Users can view own insurance policies" ON insurance_policies
  FOR SELECT USING (auth.uid() = user_id);

-- ============ RIDE CONCIERGE POLICIES ============
CREATE POLICY "Users can view own rides" ON ride_concierge
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own rides" ON ride_concierge
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============ SOCIAL REWARDS POLICIES ============
CREATE POLICY "Users can view own social rewards" ON social_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own social rewards" ON social_rewards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============ REFERRALS POLICIES ============
CREATE POLICY "Users can view referrals they made" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals they received" ON referrals
  FOR SELECT USING (auth.uid() = referred_id);

-- ============ DISPUTES POLICIES ============
CREATE POLICY "Users can view disputes they initiated" ON disputes
  FOR SELECT USING (auth.uid() = initiated_by);

CREATE POLICY "Users can view disputes for their bookings" ON disputes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = disputes.booking_id 
      AND (bookings.renter_id = auth.uid() OR bookings.host_id = auth.uid())
    )
  );

CREATE POLICY "Users can create disputes" ON disputes
  FOR INSERT WITH CHECK (auth.uid() = initiated_by);

-- ============ HOST LAB POLICIES ============
CREATE POLICY "Users can view own lab level" ON host_lab_levels
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public leaderboard view" ON host_lab_levels
  FOR SELECT USING (true);

CREATE POLICY "Users can view own challenge progress" ON host_challenge_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own achievements" ON host_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own XP transactions" ON xp_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ============ RENTER ROAD POLICIES ============
CREATE POLICY "Users can view own road score" ON renter_road_scores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Hosts can view renter scores for their bookings" ON renter_road_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.renter_id = renter_road_scores.user_id 
      AND bookings.host_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own badges" ON renter_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own trip photos" ON trip_photos
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public photos are viewable" ON trip_photos
  FOR SELECT USING (is_public = true AND is_approved = true);

CREATE POLICY "Users can vote on photos" ON photo_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own rewards" ON renter_rewards
  FOR SELECT USING (auth.uid() = user_id);

-- ============ HOST BLOCKED RENTERS POLICIES ============
CREATE POLICY "Hosts can manage blocked renters" ON host_blocked_renters
  FOR ALL USING (auth.uid() = host_id);

-- ============ ADMIN POLICIES (service role bypass) ============
-- Note: Admins use service role key which bypasses RLS

-- Create admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies for key tables
CREATE POLICY "Admins can view all vehicles" ON vehicles
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all vehicles" ON vehicles
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all bookings" ON bookings
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can view all users" ON profiles
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all users" ON profiles
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can view all disputes" ON disputes
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all disputes" ON disputes
  FOR UPDATE USING (is_admin());
