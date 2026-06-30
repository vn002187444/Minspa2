-- Fix for "record 'new' has no field 'appointment_date'" error
-- This migration dynamically finds trigger functions on 'appointments' table 
-- and replaces references to 'appointment_date' and 'appointment_time' with 'start_time'.

DO $$
DECLARE
    func_rec RECORD;
    func_def TEXT;
    fixed_def TEXT;
BEGIN
    -- Find all functions used by triggers on the 'appointments' table
    FOR func_rec IN 
        SELECT p.proname, p.oid
        FROM pg_proc p
        JOIN pg_trigger t ON t.tgfoid = p.oid
        WHERE t.tgrelid = 'appointments'::regclass
    LOOP
        func_def := pg_get_functiondef(func_rec.oid);
        
        IF func_def LIKE '%appointment_date%' THEN
            RAISE NOTICE 'Fixing function %', func_rec.proname;
            
            fixed_def := func_def;
            
            -- Fix 1: Replace the combination of date + time with start_time
            fixed_def := replace(fixed_def, 'NEW.appointment_date + NEW.appointment_time::time', 'NEW.start_time');
            
            -- Fix 2: Replace standalone appointment_date with start_time::date
            fixed_def := replace(fixed_def, 'NEW.appointment_date', 'NEW.start_time::date');
            
            -- Fix 3: Replace standalone appointment_time with start_time::time (if any)
            fixed_def := replace(fixed_def, 'NEW.appointment_time', 'NEW.start_time::time');
            
            EXECUTE fixed_def;
        END IF;
    END LOOP;
END $$;
