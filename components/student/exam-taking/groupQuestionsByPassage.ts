import { SessionQuestion } from "@/types/exam-session";

export interface StandaloneBlock {
  kind: "standalone";
  question: SessionQuestion;
  globalIndex: number;
}

export interface PassageBlock {
  kind: "passage";
  passageId: string;
  passageTitle?: string;
  passageText: string;
  passageKind?: string;
  items: { question: SessionQuestion; globalIndex: number }[];
}

export type QuestionBlock = StandaloneBlock | PassageBlock;

// Groups a flat, already-ordered question list into standalone questions
// and passage groups, WITHOUT assuming a passage's siblings sit next to
// each other in the array - an odd attach order could interleave them,
// and this shouldn't silently split a group apart if that happens.
// Grouping is based purely on shared passageId, wherever its members
// actually are in the list.
//
// globalIndex is preserved per question (its position in the ORIGINAL
// flat array) because QuestionCard uses it to build a stable DOM id
// (`question-${globalIndex}`) - that id needs to keep meaning whatever
// external code might jump to it, independent of how grouping re-arranges
// the visual layout.
export function groupQuestionsByPassage(questions: SessionQuestion[]): QuestionBlock[] {
  const blocks: QuestionBlock[] = [];
  const blockIndexByPassageId = new Map<string, number>();

  questions.forEach((question, globalIndex) => {
    if (!question.passageId) {
      blocks.push({ kind: "standalone", question, globalIndex });
      return;
    }

    const existingBlockIndex = blockIndexByPassageId.get(question.passageId);
    if (existingBlockIndex === undefined) {
      blockIndexByPassageId.set(question.passageId, blocks.length);
      blocks.push({
        kind: "passage",
        passageId: question.passageId,
        passageTitle: question.passageTitle,
        passageText: question.passageText ?? "",
        passageKind: question.passageKind,
        items: [{ question, globalIndex }],
      });
    } else {
      (blocks[existingBlockIndex] as PassageBlock).items.push({ question, globalIndex });
    }
  });

  // Defensive re-sort within each group by passageOrder - the server
  // already keeps a group's members in sequence (see the /start route's
  // shuffle logic), this just guards against the two ever diverging
  // rather than trusting incidental array order.
  for (const block of blocks) {
    if (block.kind === "passage") {
      block.items.sort((a, b) => (a.question.passageOrder ?? 0) - (b.question.passageOrder ?? 0));
    }
  }

  return blocks;
}
