-- PreSignal이 가장 최근 데이터를 저장하는 표.
-- 서버가 서비스 키로만 읽고 쓰므로 RLS를 켜고 정책은 만들지 않는다.
create table if not exists public.snapshots (
  key text primary key,
  fetched_at timestamptz not null,
  data jsonb not null
);

alter table public.snapshots enable row level security;
