-- Functions
CREATE OR REPLACE FUNCTION public.decrement_record_count () RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
UPDATE public.record_count
SET count = count - 1
WHERE table_name = 'user';
RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_record_count () RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
UPDATE public.record_count
SET count = count + 1
WHERE table_name = 'user';
RETURN NEW;
END;
$$;

-- Tables
CREATE TABLE IF NOT EXISTS public.record_count (
  table_name text NOT NULL,
  count bigint DEFAULT 0 NOT NULL,
  PRIMARY KEY (table_name)
);

CREATE TABLE IF NOT EXISTS public.score (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  follows bigint NOT NULL,
  unfollows bigint NOT NULL,
  winnerId bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  account varchar NOT NULL UNIQUE,
  eligible boolean NOT NULL DEFAULT TRUE,
  should_unfollow boolean NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.winner (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  winDate TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  userId bigint,
  tx varchar NOT NULL UNIQUE
);

-- Foreign Keys
ALTER TABLE ONLY public.score
ADD CONSTRAINT scores_winnerId_fkey FOREIGN KEY (winnerId) REFERENCES public.winner (id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.winner
ADD CONSTRAINT winner_userId_fkey FOREIGN KEY (userId) REFERENCES public.user (id) ON UPDATE CASCADE ON DELETE SET NULL;

-- Triggers
CREATE TRIGGER user_insert_trigger
AFTER INSERT ON public.user FOR EACH ROW
EXECUTE FUNCTION public.increment_record_count ();

CREATE TRIGGER user_delete_trigger
AFTER DELETE ON public.user FOR EACH ROW
EXECUTE FUNCTION public.decrement_record_count ();

-- RLS Enablement
ALTER TABLE public.record_count ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.score ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.winner ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- score
CREATE POLICY "Public read access" ON public.record_count FOR
SELECT
  USING (TRUE);

CREATE POLICY "Public read access" ON public.score FOR
SELECT
  USING (TRUE);

CREATE POLICY "Insert access for service role" ON public.score AS RESTRICTIVE FOR INSERT TO service_role
WITH
  CHECK (TRUE);

CREATE POLICY "Update access for service role" ON public.score
FOR UPDATE
  TO service_role USING (TRUE)
WITH
  CHECK (TRUE);

CREATE POLICY "Delete access for service role" ON public.score AS RESTRICTIVE FOR DELETE TO service_role USING (TRUE);

-- user
CREATE POLICY "Public read access" ON public.user FOR
SELECT
  USING (TRUE);

CREATE POLICY "Insert access for service role" ON public.user AS RESTRICTIVE FOR INSERT TO service_role
WITH
  CHECK (TRUE);

CREATE POLICY "Update access for service role" ON public.user AS RESTRICTIVE
FOR UPDATE
  TO service_role USING (TRUE)
WITH
  CHECK (TRUE);

CREATE POLICY "Delete access for service role" ON public.user AS RESTRICTIVE FOR DELETE TO service_role USING (TRUE);

-- winner
CREATE POLICY "Public read access" ON public.winner FOR
SELECT
  USING (TRUE);

CREATE POLICY "Insert access for service role" ON public.winner AS RESTRICTIVE FOR INSERT TO service_role
WITH
  CHECK (TRUE);

CREATE POLICY "Update access for service role" ON public.winner AS RESTRICTIVE
FOR UPDATE
  TO service_role USING (TRUE)
WITH
  CHECK (TRUE);

CREATE POLICY "Delete access for service role" ON public.winner AS RESTRICTIVE FOR DELETE TO service_role USING (TRUE);
