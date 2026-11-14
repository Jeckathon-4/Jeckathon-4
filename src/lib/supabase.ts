import { createClient } from "@supabase/supabase-js";

// 브라우저/서버 공용 Supabase 클라이언트. 키는 .env.local 참고 (.env.example 복사)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);
