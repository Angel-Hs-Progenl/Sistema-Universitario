export function answerText(question, answer) {
  if (
    answer == null ||
    answer === "" ||
    (Array.isArray(answer) && !answer.length)
  )
    return "Sin respuesta";
  const label = (value) =>
    question.options?.find((option) => option.value === value)?.label ||
    String(value);
  return Array.isArray(answer) ? answer.map(label).join(", ") : label(answer);
}
export function AnswerList({ questionnaire, answers = {} }) {
  return (
    <dl className="self-answer-list">
      {questionnaire.questions.map((question, i) => (
        <div key={question.id}>
          <dt>
            {i + 1}. {question.text}
          </dt>
          <dd>{answerText(question, answers?.[question.id])}</dd>
        </div>
      ))}
    </dl>
  );
}
