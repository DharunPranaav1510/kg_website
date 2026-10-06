"use client";

import ItemsEditor from "./ItemsEditor";

export default function FaqEditor() {
  return (
    <ItemsEditor
      kind="faqs"
      noun="question"
      empty={{ question: "", answer: "", active: true }}
      fields={[
        { key: "question", label: "Question", type: "text", max: 200, placeholder: "e.g. Do you deliver on Sundays?" },
        { key: "answer", label: "Answer", type: "textarea", max: 1500 },
      ]}
      title={(i) => String(i.question)}
      sub={(i) => String(i.answer)}
      defaultsNotice={
        <>
          <b>These are the starting questions.</b> Copy them into the database to edit them. Only add things that are true for your shop (for example, add a
          halal or certification answer only if you hold the certificate).
        </>
      }
    />
  );
}
