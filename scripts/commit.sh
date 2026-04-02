#!/bin/bash
cd /vercel/share/v0-project
git add -A
git commit -m "perf: Database indexes and real-time subscriptions

Database Indexes:
- idx_bookings_host_status_date: Composite index for host booking queries
- idx_vehicles_host_status: Composite index for vehicle status queries
- idx_bookings_date_range: Partial index for calendar availability queries
- idx_profiles_host: Partial index for host profile lookups
- ANALYZE run on bookings, vehicles, profiles tables

Real-Time Updates:
- Added Supabase postgres_changes subscription for bookings
- Added Supabase postgres_changes subscription for vehicles
- Optimistic UI updates on INSERT/UPDATE/DELETE events
- Proper channel cleanup on unmount"
git push
