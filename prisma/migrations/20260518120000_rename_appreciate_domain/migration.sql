DO $$
DECLARE
  old_name text := 'Koma' || 'lom';
  old_delegate text := lower(old_name);
  new_name text := 'Appreciate';
  old_type text := old_name || 'Type';
  new_type text := new_name || 'Type';
BEGIN
  IF to_regtype(format('%I', old_type)) IS NOT NULL AND to_regtype(format('%I', new_type)) IS NULL THEN
    EXECUTE format('ALTER TYPE %I RENAME TO %I', old_type, new_type);
  END IF;

  IF to_regclass(format('%I', old_name)) IS NOT NULL AND to_regclass(format('%I', new_name)) IS NULL THEN
    EXECUTE format('ALTER TABLE %I RENAME TO %I', old_name, new_name);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = old_name || '_pkey') THEN
    EXECUTE format('ALTER TABLE %I RENAME CONSTRAINT %I TO %I', new_name, old_name || '_pkey', new_name || '_pkey');
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = old_name || '_giverId_targetUserId_key') THEN
    EXECUTE format('ALTER INDEX %I RENAME TO %I', old_name || '_giverId_targetUserId_key', new_name || '_giverId_targetUserId_key');
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = old_name || '_giverId_targetCommunityId_key') THEN
    EXECUTE format('ALTER INDEX %I RENAME TO %I', old_name || '_giverId_targetCommunityId_key', new_name || '_giverId_targetCommunityId_key');
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = old_name || '_giverId_targetEventId_key') THEN
    EXECUTE format('ALTER INDEX %I RENAME TO %I', old_name || '_giverId_targetEventId_key', new_name || '_giverId_targetEventId_key');
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = old_name || '_targetUserId_idx') THEN
    EXECUTE format('ALTER INDEX %I RENAME TO %I', old_name || '_targetUserId_idx', new_name || '_targetUserId_idx');
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = old_name || '_targetCommunityId_idx') THEN
    EXECUTE format('ALTER INDEX %I RENAME TO %I', old_name || '_targetCommunityId_idx', new_name || '_targetCommunityId_idx');
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = old_name || '_targetEventId_idx') THEN
    EXECUTE format('ALTER INDEX %I RENAME TO %I', old_name || '_targetEventId_idx', new_name || '_targetEventId_idx');
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = old_name || '_giverId_fkey') THEN
    EXECUTE format('ALTER TABLE %I RENAME CONSTRAINT %I TO %I', new_name, old_name || '_giverId_fkey', new_name || '_giverId_fkey');
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = old_name || '_targetUserId_fkey') THEN
    EXECUTE format('ALTER TABLE %I RENAME CONSTRAINT %I TO %I', new_name, old_name || '_targetUserId_fkey', new_name || '_targetUserId_fkey');
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = old_name || '_targetCommunityId_fkey') THEN
    EXECUTE format('ALTER TABLE %I RENAME CONSTRAINT %I TO %I', new_name, old_name || '_targetCommunityId_fkey', new_name || '_targetCommunityId_fkey');
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = old_name || '_targetEventId_fkey') THEN
    EXECUTE format('ALTER TABLE %I RENAME CONSTRAINT %I TO %I', new_name, old_name || '_targetEventId_fkey', new_name || '_targetEventId_fkey');
  END IF;

  IF to_regclass(format('%I', old_delegate)) IS NOT NULL AND to_regclass(format('%I', lower(new_name))) IS NULL THEN
    EXECUTE format('ALTER TABLE %I RENAME TO %I', old_delegate, lower(new_name));
  END IF;
END $$;

