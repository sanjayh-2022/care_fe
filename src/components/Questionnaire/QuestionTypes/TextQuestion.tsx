import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

interface TextQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  clearError: () => void;
}

export function TextQuestion({
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  clearError,
}: TextQuestionProps) {
  const handleChange = (value: string) => {
    clearError();
    updateQuestionnaireResponseCB(
      [
        {
          type: "string",
          value,
        },
      ],
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  return (
    <>
      {question.type === "text" ? (
        <Textarea
          value={questionnaireResponse.values[0]?.value?.toString() || ""}
          onChange={(e) => handleChange(e.target.value)}
          className="min-h-[100px]"
          disabled={disabled}
        />
      ) : (
        <Input
          type="text"
          value={questionnaireResponse.values[0]?.value?.toString() || ""}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
        />
      )}
    </>
  );
}
