-- Migration: Add facebook_url and zalo_url to seo_settings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='seo_settings' AND column_name='facebook_url'
    ) THEN
        ALTER TABLE seo_settings ADD COLUMN facebook_url VARCHAR(500) DEFAULT 'https://facebook.com/minnailhair';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='seo_settings' AND column_name='zalo_url'
    ) THEN
        ALTER TABLE seo_settings ADD COLUMN zalo_url VARCHAR(500) DEFAULT 'https://zalo.me/0934323878';
    END IF;
END $$;
