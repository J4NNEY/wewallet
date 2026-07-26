export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  category: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface CalculatorHistory {
  id: string;
  user_id: string;
  expression: string;
  result: number;
  created_at: string;
}

export interface ShoppingList {
  id: string;
  user_id: string;
  name: string;
  is_completed: boolean;
  created_at: string;
}

export interface ShoppingListItem {
  id: string;
  list_id: string;
  item_name: string;
  quantity: number;
  unit: string | null;
  estimated_price: number;
  is_checked: boolean;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string;
  repeat_type: "none" | "daily" | "weekly" | "monthly";
  is_completed: boolean;
  created_at: string;
}

export interface FinanceRecord {
  id: string;
  user_id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  created_at: string;
}
