-- Enable Realtime for specific tables
begin;
  -- Remove from publication if they exist to avoid duplicate errors, then add them
  alter publication supabase_realtime drop table if exists app_config;
  alter publication supabase_realtime drop table if exists platform_fee_payments;
  
  alter publication supabase_realtime add table app_config;
  alter publication supabase_realtime add table platform_fee_payments;
commit;
