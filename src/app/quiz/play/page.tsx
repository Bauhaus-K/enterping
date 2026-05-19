import { parseQuizCategory } from "../../../lib/quizData";
import { getPublishedQuizItemsByCategory } from "../../../lib/quizRepository";
import { QuizBattle } from "./QuizBattle";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

interface QuizPlayPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function QuizPlayPage({ searchParams }: QuizPlayPageProps) {
  const resolvedSearchParams = await searchParams;
  const category = parseQuizCategory(resolvedSearchParams.category);
  const items = await getPublishedQuizItemsByCategory(category);

  return (
    <main className={styles.page}>
      <QuizBattle category={category} items={items} />
    </main>
  );
}
