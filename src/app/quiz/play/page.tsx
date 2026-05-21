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
  const mode = parseQuizMode(resolvedSearchParams.mode);
  const roomCode = parseRoomCode(resolvedSearchParams.room);
  const items = await getPublishedQuizItemsByCategory(category);

  return (
    <main className={styles.page}>
      <QuizBattle category={category} items={items} mode={mode} roomCode={roomCode} />
    </main>
  );
}

function parseQuizMode(value: string | string[] | undefined) {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  return normalizedValue === "battle" ? "battle" : "solo";
}

function parseRoomCode(value: string | string[] | undefined) {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  return normalizedValue?.trim() || undefined;
}
