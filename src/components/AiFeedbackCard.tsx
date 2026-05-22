import type { AiErrorFeedback } from "../lib/aiAnalysisPrompt";
import styles from "./AiFeedbackCard.module.css";

export interface AiFeedbackCardProps {
  feedback?: AiErrorFeedback | null;
  isLoading?: boolean;
}

export function AiFeedbackCard({ feedback, isLoading = false }: AiFeedbackCardProps) {
  return (
    <article className={styles.card} aria-label="AI error analysis feedback">
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>AI Error Analysis</span>
          <h3>Personal typing coach</h3>
        </div>
        <div className={styles.orb} aria-hidden="true" />
      </div>

      {isLoading ? (
        <div className={styles.loadingState}>
          <span />
          <p>Analyzing recent typo patterns...</p>
        </div>
      ) : feedback ? (
        <div className={styles.feedbackGrid}>
          <section className={styles.primaryFinding}>
            <span>Weakness</span>
            <strong>{feedback.weakness}</strong>
          </section>
          <section>
            <span>Practice Tip</span>
            <p>{feedback.tip}</p>
          </section>
          <section>
            <span>Encouragement</span>
            <p>{feedback.encouragement}</p>
          </section>
          {feedback.trainingRecommendations?.length ? (
            <section className={styles.trainingBlock}>
              <span>Pattern Training</span>
              <div className={styles.trainingList}>
                {feedback.trainingRecommendations.map((recommendation) => (
                  <article key={recommendation.patternId} className={styles.trainingItem}>
                    <div>
                      <strong>{recommendation.label}</strong>
                      <small>
                        {recommendation.severity.toUpperCase()} · {recommendation.count}회 감지
                      </small>
                    </div>
                    <p>{recommendation.drill}</p>
                    {recommendation.samplePrompts.length > 0 ? (
                      <div className={styles.sampleChips}>
                        {recommendation.samplePrompts.slice(0, 3).map((sample) => (
                          <span key={sample}>{sample}</span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <strong>No AI feedback yet</strong>
          <p>Play a few rounds or request analysis to unlock personalized coaching.</p>
        </div>
      )}
    </article>
  );
}
