import { LoginForm } from "@/components/admin/login-form";

export default async function AdminLoginPage(
  props: PageProps<"/admin/login">,
) {
  const search = await props.searchParams;
  const next = typeof search.next === "string" ? search.next : "/admin";

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm rounded-2xl border border-ink-200 bg-white p-8 shadow-sm">
        <p className="text-xl font-extrabold text-brand-700">헬씨팜바이오</p>
        <h1 className="mt-1 text-sm text-ink-500">관리자 로그인</h1>
        <div className="mt-8">
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
