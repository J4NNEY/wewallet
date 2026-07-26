-- =========================================
-- WeWallet Database Schema
-- Jalankan di: Supabase Dashboard → SQL Editor
-- =========================================

-- =========================================
-- Tabel Profiles (tambahan info user)
-- =========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- Tabel Notes (Catatan / Rekap)
-- =========================================
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- Tabel Calculator History (Riwayat Kalkulator)
-- =========================================
CREATE TABLE IF NOT EXISTS calculator_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  expression TEXT NOT NULL,
  result NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- Tabel Shopping Lists (Daftar Belanja) - Fase 2
-- =========================================
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT,
  estimated_price NUMERIC DEFAULT 0,
  is_checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- Tabel Reminders (Pengingat) - Fase 2
-- =========================================
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  repeat_type TEXT DEFAULT 'none',
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- Tabel Finance Records (Laporan Keuangan) - Fase 3
-- =========================================
CREATE TABLE IF NOT EXISTS finance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- ENABLE ROW LEVEL SECURITY
-- =========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculator_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_records ENABLE ROW LEVEL SECURITY;

-- =========================================
-- RLS POLICIES
-- =========================================

-- Profiles: User bisa baca & update profil sendiri
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Notes: User bisa CRUD catatan sendiri
CREATE POLICY "Users can view own notes"
  ON notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE
  USING (auth.uid() = user_id);

-- Calculator History: User bisa CRUD riwayat sendiri
CREATE POLICY "Users can view own calculator history"
  ON calculator_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calculator history"
  ON calculator_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calculator history"
  ON calculator_history FOR DELETE
  USING (auth.uid() = user_id);

-- Shopping Lists: User bisa CRUD list sendiri
CREATE POLICY "Users can view own shopping lists"
  ON shopping_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shopping lists"
  ON shopping_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shopping lists"
  ON shopping_lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shopping lists"
  ON shopping_lists FOR DELETE
  USING (auth.uid() = user_id);

-- Shopping List Items: Akses via relasi ke shopping_lists
CREATE POLICY "Users can view own shopping list items"
  ON shopping_list_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_list_items.list_id
      AND shopping_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own shopping list items"
  ON shopping_list_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_list_items.list_id
      AND shopping_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own shopping list items"
  ON shopping_list_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_list_items.list_id
      AND shopping_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own shopping list items"
  ON shopping_list_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_list_items.list_id
      AND shopping_lists.user_id = auth.uid()
    )
  );

-- Reminders: User bisa CRUD reminder sendiri
CREATE POLICY "Users can view own reminders"
  ON reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
  ON reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Finance Records: User bisa CRUD record sendiri
CREATE POLICY "Users can view own finance records"
  ON finance_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own finance records"
  ON finance_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own finance records"
  ON finance_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own finance records"
  ON finance_records FOR DELETE
  USING (auth.uid() = user_id);

-- =========================================
-- FUNCTION: Auto-create profile on signup
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-create profile when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
