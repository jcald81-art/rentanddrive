-- Rent and Drive LLC - Seed Data Migration

-- ============ SEED MODEL STATUS ============
INSERT INTO model_status (model_name, provider, is_available, is_primary, priority, avg_latency_ms) VALUES
  ('gpt-4o', 'openai', true, true, 1, 800),
  ('gpt-4o-mini', 'openai', true, false, 2, 400),
  ('claude-3-5-sonnet', 'anthropic', true, false, 3, 900),
  ('gemini-1.5-pro', 'google', true, false, 4, 700),
  ('gemini-1.5-flash', 'google', true, false, 5, 300),
  ('llama-3.1-70b', 'groq', true, false, 6, 200),
  ('deepseek-chat', 'deepseek', true, false, 7, 500),
  ('grok-beta', 'xai', true, false, 8, 600)
ON CONFLICT (model_name) DO NOTHING;

-- ============ SEED LAB CHALLENGES ============
INSERT INTO lab_challenges (title, description, xp_reward, badge_reward, badge_icon, requirement_type, requirement_value, requirement_timeframe, category, difficulty, sort_order) VALUES
  -- Onboarding challenges
  ('First Steps', 'Complete your host profile with a photo and bio', 100, 'profile_complete', '👤', 'profile_complete', 1, 'all_time', 'onboarding', 'easy', 1),
  ('List Your First Vehicle', 'Add your first vehicle to the platform', 200, 'first_listing', '🚗', 'vehicles_listed', 1, 'all_time', 'onboarding', 'easy', 2),
  ('First Booking', 'Complete your first rental booking', 300, 'first_booking', '🎉', 'first_booking', 1, 'all_time', 'onboarding', 'easy', 3),
  ('Photo Pro', 'Upload at least 8 photos for one vehicle', 150, 'photo_pro', '📸', 'photos_uploaded', 8, 'all_time', 'onboarding', 'easy', 4),
  
  -- Growth challenges
  ('Rising Star', 'Complete 5 bookings', 500, 'rising_star', '⭐', 'bookings_count', 5, 'all_time', 'growth', 'medium', 10),
  ('Busy Host', 'Complete 25 bookings', 1000, 'busy_host', '🔥', 'bookings_count', 25, 'all_time', 'growth', 'hard', 11),
  ('Fleet Master', 'List 3 or more vehicles', 750, 'fleet_master', '🚙', 'vehicles_listed', 3, 'all_time', 'growth', 'medium', 12),
  ('Earnings Milestone', 'Earn $1,000 in total', 400, 'first_grand', '💰', 'earnings_amount', 100000, 'all_time', 'growth', 'medium', 13),
  ('Big Earner', 'Earn $5,000 in total', 1500, 'big_earner', '💎', 'earnings_amount', 500000, 'all_time', 'growth', 'hard', 14),
  
  -- Quality challenges
  ('Five Star Host', 'Receive your first 5-star review', 250, 'five_star', '⭐', 'five_star_reviews', 1, 'all_time', 'quality', 'easy', 20),
  ('Highly Rated', 'Receive 10 five-star reviews', 800, 'highly_rated', '🌟', 'five_star_reviews', 10, 'all_time', 'quality', 'hard', 21),
  ('Quick Responder', 'Maintain response time under 1 hour', 300, 'quick_responder', '⚡', 'response_time', 60, 'monthly', 'quality', 'medium', 22),
  
  -- Engagement challenges
  ('Social Butterfly', 'Share your listing on social media', 200, 'social_share', '📱', 'social_share', 1, 'all_time', 'engagement', 'easy', 30),
  ('Ambassador', 'Refer 3 new hosts to the platform', 1000, 'ambassador', '🤝', 'referrals', 3, 'all_time', 'engagement', 'hard', 31),
  
  -- Milestone challenges
  ('Weekly Warrior', 'Maintain a 7-day activity streak', 400, 'weekly_warrior', '📅', 'streak_days', 7, 'all_time', 'milestone', 'medium', 40),
  ('Monthly Master', 'Maintain a 30-day activity streak', 1200, 'monthly_master', '🏆', 'streak_days', 30, 'all_time', 'milestone', 'hard', 41),
  ('Perfect Month', 'Complete a month with 100% acceptance rate and all 5-star reviews', 2000, 'perfect_month', '💫', 'perfect_month', 1, 'monthly', 'milestone', 'legendary', 42),
  ('Repeat Customers', 'Have 5 renters book with you more than once', 600, 'loyal_following', '❤️', 'repeat_customers', 5, 'all_time', 'milestone', 'hard', 43),
  ('Century Club', 'Complete 100 bookings', 5000, 'century_club', '💯', 'bookings_count', 100, 'all_time', 'milestone', 'legendary', 44)
ON CONFLICT DO NOTHING;

-- ============ SEED PLATFORM SETTINGS ============
INSERT INTO platform_settings (key, value, description, is_public) VALUES
  ('platform_fee_percentage', '10', 'Platform fee percentage charged on bookings', false),
  ('min_booking_days', '1', 'Minimum booking duration in days', true),
  ('max_booking_days', '30', 'Maximum booking duration in days', true),
  ('security_deposit_default', '25000', 'Default security deposit in cents', false),
  ('young_driver_age', '25', 'Age threshold for young driver fee', true),
  ('young_driver_fee', '1500', 'Young driver fee per day in cents', true),
  ('cancellation_free_hours', '24', 'Hours before pickup for free cancellation', true),
  ('cancellation_fee_percentage', '50', 'Cancellation fee percentage after free period', false),
  ('vin_report_price', '499', 'VIN report price in cents', true),
  ('social_reward_photo', '1000', 'Reward for photo post in cents', false),
  ('social_reward_reel', '1500', 'Reward for reel/video post in cents', false),
  ('referral_reward_referrer', '2500', 'Referral reward for referrer in cents', false),
  ('referral_reward_referred', '2500', 'Referral reward for new user in cents', false),
  ('maintenance_mode', 'false', 'Platform maintenance mode', false),
  ('feature_crypto_payments', 'false', 'Enable cryptocurrency payments (beta)', false),
  ('feature_motorcycle_listings', 'true', 'Enable motorcycle listings', true),
  ('feature_rv_listings', 'true', 'Enable RV listings', true),
  ('ai_gateway_default_model', 'gpt-4o-mini', 'Default AI model for agents', false)
ON CONFLICT (key) DO NOTHING;

-- ============ SEED PROMO CODES ============
INSERT INTO promo_codes (code, description, discount_type, discount_value, max_discount_cents, valid_until, is_first_booking_only) VALUES
  ('WELCOME25', 'Welcome discount - 25% off first booking', 'percentage', 25, 5000, NOW() + INTERVAL '1 year', true),
  ('TAHOE10', 'Lake Tahoe special - $10 off', 'fixed_amount', 1000, null, NOW() + INTERVAL '6 months', false),
  ('WINTER2024', 'Winter season special - 15% off', 'percentage', 15, 3000, '2024-03-31', false)
ON CONFLICT (code) DO NOTHING;

-- ============ CREATE TRIGGER FOR NEW USER AGENTS ============
CREATE OR REPLACE FUNCTION create_user_agents()
RETURNS TRIGGER AS $$
BEGIN
  -- Create all 6 agents for new user
  INSERT INTO rd_agents (user_id, agent_type, default_name) VALUES
    (NEW.id, 'communications', 'Communications Agent'),
    (NEW.id, 'pricing', 'Pricing Agent'),
    (NEW.id, 'reputation', 'Reputation Agent'),
    (NEW.id, 'intel', 'Intel Agent'),
    (NEW.id, 'fleet', 'Fleet Agent'),
    (NEW.id, 'engagement', 'Engagement Agent')
  ON CONFLICT (user_id, agent_type) DO NOTHING;
  
  -- Create lab level entry for hosts
  IF NEW.role IN ('host', 'admin') THEN
    INSERT INTO host_lab_levels (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  -- Create renter road score entry
  INSERT INTO renter_road_scores (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_profile_created ON profiles;

-- Create trigger
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_agents();

-- ============ CREATE TRIGGER FOR BOOKING XP ============
CREATE OR REPLACE FUNCTION award_booking_xp()
RETURNS TRIGGER AS $$
DECLARE
  host_level_record RECORD;
  xp_amount INTEGER := 50;
BEGIN
  -- Only award XP when booking is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Get host's current level
    SELECT * INTO host_level_record FROM host_lab_levels WHERE user_id = NEW.host_id;
    
    IF host_level_record IS NOT NULL THEN
      -- Update XP
      UPDATE host_lab_levels
      SET 
        xp = xp + xp_amount,
        total_trips_hosted = total_trips_hosted + 1,
        updated_at = NOW()
      WHERE user_id = NEW.host_id;
      
      -- Log XP transaction
      INSERT INTO xp_transactions (user_id, amount, reason, source_type, source_id, balance_after)
      VALUES (NEW.host_id, xp_amount, 'Completed booking', 'booking', NEW.id, host_level_record.xp + xp_amount);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_booking_completed ON bookings;

CREATE TRIGGER on_booking_completed
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION award_booking_xp();

-- ============ CREATE TRIGGER FOR REVIEW XP ============
CREATE OR REPLACE FUNCTION award_review_xp()
RETURNS TRIGGER AS $$
DECLARE
  host_level_record RECORD;
  xp_amount INTEGER;
BEGIN
  -- Award XP for receiving 5-star reviews (host receiving review)
  IF NEW.type = 'renter_to_host' AND NEW.rating = 5 THEN
    SELECT * INTO host_level_record FROM host_lab_levels WHERE user_id = NEW.reviewee_id;
    
    IF host_level_record IS NOT NULL THEN
      xp_amount := 25;
      
      UPDATE host_lab_levels
      SET 
        xp = xp + xp_amount,
        total_five_star_reviews = total_five_star_reviews + 1,
        updated_at = NOW()
      WHERE user_id = NEW.reviewee_id;
      
      INSERT INTO xp_transactions (user_id, amount, reason, source_type, source_id, balance_after)
      VALUES (NEW.reviewee_id, xp_amount, 'Received 5-star review', 'review', NEW.id, host_level_record.xp + xp_amount);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_created ON reviews;

CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION award_review_xp();

-- ============ CREATE FUNCTION TO UPDATE VEHICLE RATING ============
CREATE OR REPLACE FUNCTION update_vehicle_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'renter_to_vehicle' AND NEW.vehicle_id IS NOT NULL THEN
    UPDATE vehicles
    SET 
      rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM reviews
        WHERE vehicle_id = NEW.vehicle_id AND type = 'renter_to_vehicle'
      ),
      review_count = (
        SELECT COUNT(*)
        FROM reviews
        WHERE vehicle_id = NEW.vehicle_id AND type = 'renter_to_vehicle'
      ),
      updated_at = NOW()
    WHERE id = NEW.vehicle_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vehicle_review ON reviews;

CREATE TRIGGER on_vehicle_review
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_rating();

-- ============ CREATE FUNCTION TO CHECK HOST LEVEL UP ============
CREATE OR REPLACE FUNCTION check_level_up()
RETURNS TRIGGER AS $$
DECLARE
  new_level INTEGER;
  new_rank TEXT;
BEGIN
  -- Calculate new level based on XP (100 XP per level, exponential scaling)
  new_level := FLOOR(SQRT(NEW.xp / 100)) + 1;
  
  -- Cap at level 100
  IF new_level > 100 THEN
    new_level := 100;
  END IF;
  
  -- Determine rank
  IF new_level >= 50 THEN
    new_rank := 'legend';
  ELSIF new_level >= 25 THEN
    new_rank := 'elite';
  ELSIF new_level >= 10 THEN
    new_rank := 'pro';
  ELSE
    new_rank := 'rookie';
  END IF;
  
  -- Update if changed
  IF new_level != NEW.level OR new_rank != NEW.rank THEN
    NEW.level := new_level;
    NEW.rank := new_rank;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_lab_level_update ON host_lab_levels;

CREATE TRIGGER before_lab_level_update
  BEFORE UPDATE ON host_lab_levels
  FOR EACH ROW
  EXECUTE FUNCTION check_level_up();
