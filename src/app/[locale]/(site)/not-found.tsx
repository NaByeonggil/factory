import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/section";

export default function NotFound() {
  return (
    <Section>
      <Container className="max-w-lg text-center">
        <p className="text-6xl font-extrabold text-brand-600">404</p>
        <h1 className="mt-4 text-2xl font-bold text-ink-900">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="mt-3 text-ink-600">
          주소가 변경되었거나 삭제된 페이지입니다.
        </p>
        <Button asChild className="mt-8">
          <Link href="/">홈으로</Link>
        </Button>
      </Container>
    </Section>
  );
}
