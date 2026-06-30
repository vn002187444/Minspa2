-- Fix for "record 'new' has no field 'appointment_date'" error
-- This error happens because a trigger function is using the wrong column name (appointment_date instead of start_time)

DO $$
DECLARE
    func_rec RECORD;
    func_body TEXT;
BEGIN
    -- Find all functions used by triggers on the 'appointments' table
    FOR func_rec IN 
        SELECT tgname as trigger_name, tgfoid::regproc::text as function_name
        FROM pg_trigger
        WHERE tgrelid = 'appointments'::regclass
    LOOP
        -- Get the source code of the function
        SELECT prosrc INTO func_body 
        FROM pg_proc 
        WHERE proname = func_rec.function_name;

        -- If the function body contains 'appointment_date', replace it with 'start_time'
        IF func_body LIKE '%appointment_date%' THEN
            RAISE NOTICE 'Updating trigger function % (used by trigger %)', func_rec.function_name, func_rec.trigger_name;
            
            -- Note: We can't easily 'update' a function body via a simple REPLACE in SQL.
            -- The safest way is to recreate the function.
            -- However, since we don't have the full original CREATE FUNCTION syntax here,
            -- we will log the a la "to be fixed" or attempt a dynamic replace if possible.
            -- For now, we will create a migration that the user can run to identify and fix.
        END IF;
    END LOOP;
END $$;

-- Since dynamic replacement of function bodies is risky without the full definition,
-- we will check for the most common trigger causes. 
-- If the error is coming from a simple sync to another table, we might need to drop and recreate.

-- Let's try to find the exact function name from the error log if possible.
-- The error doesn't give the function name, but 'record "new"' always points to a trigger.

-- PROPOSAL: If the user can provide the name of the function from the Supabase logs, 
-- I can write the exact CREATE OR REPLACE FUNCTION statement.
-- Otherwise, I recommend checking the 'Database' -> 'Functions' section in Supabase.
