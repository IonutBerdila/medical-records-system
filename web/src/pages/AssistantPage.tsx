import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Textarea } from "../ui/Textarea";
import { IconAlert } from "../ui/Icons";
import { sendAssistantMessage } from "../app/assistant/assistantApi";
import type {
  AssistantChatResponse,
  AssistantHistoryMessage,
  AssistantSuggestedDoctor,
} from "../app/assistant/types";

interface ChatTurn {
  id: number;
  role: "user" | "assistant";
  /** Pentru pacient: mesajul scris. Pentru asistent: textul răspunsului. */
  content: string;
  /** Răspunsul complet al asistentului (doar pentru rândurile asistentului). */
  data?: AssistantChatResponse;
}

export const AssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const examplePrompts = [
    t("assistant.example1"),
    t("assistant.example2"),
    t("assistant.example3"),
  ];
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const nextId = useRef(1);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns, loading]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || loading) return;

    // Istoricul local trimis la fiecare cerere (backend-ul nu îl persistă).
    const history: AssistantHistoryMessage[] = turns.map((t) => ({
      role: t.role,
      content: t.content,
    }));

    const userTurn: ChatTurn = {
      id: nextId.current++,
      role: "user",
      content: message,
    };
    setTurns((prev) => [...prev, userTurn]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await sendAssistantMessage({ message, history });
      setTurns((prev) => [
        ...prev,
        {
          id: nextId.current++,
          role: "assistant",
          content: response.answer,
          data: response,
        },
      ]);
    } catch (err: unknown) {
      type ApiErr = {
        response?: {
          status?: number;
          data?: { message?: string; detail?: string; title?: string };
        };
        message?: string;
      };
      const e = err as ApiErr;
      const status = e.response?.status;
      const apiMsg =
        e.response?.data?.detail ||
        e.response?.data?.message ||
        e.response?.data?.title;
      let msg: string;
      if (status === 503) {
        msg = apiMsg || t("assistant.errorUnavailable");
      } else if (status === 400) {
        msg = apiMsg || t("assistant.errorInvalid");
      } else if (status === 429) {
        msg = t("assistant.errorRateLimit");
      } else {
        msg = apiMsg || e.message || t("assistant.errorGeneric");
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const goToAppointment = (doctor: AssistantSuggestedDoctor) => {
    // Deschide fluxul de programare existent, cu datele doctorului sugerat.
    navigate("/appointments", {
      state: {
        fromAssistant: true,
        specialtyId: doctor.specialtyId,
        doctorInstitutionId: doctor.doctorInstitutionId,
        doctorProfileId: doctor.doctorProfileId,
      },
    });
  };

  const renderAssistantTurn = (turn: ChatTurn) => {
    const data = turn.data;
    if (!data) {
      return (
        <p className="whitespace-pre-line text-sm text-slate-700">{turn.content}</p>
      );
    }

    return (
      <div className="space-y-3">
        {data.shouldSeekUrgentCare && data.safetyNotice && (
          <div className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span className="mt-0.5 text-red-600">
              <IconAlert />
            </span>
            <div>
              <p className="font-semibold">{t("assistant.warning")}</p>
              <p className="mt-0.5">{data.safetyNotice}</p>
            </div>
          </div>
        )}

        <p className="whitespace-pre-line text-sm text-slate-700">{data.answer}</p>

        {data.clarificationQuestions.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-semibold text-slate-800">
              {t("assistant.clarificationQuestions")}
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              {data.clarificationQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        )}

        {data.suggestedSpecialties.length > 0 && (
          <div>
            <p className="mb-1.5 text-sm font-semibold text-slate-800">
              {t("assistant.recommendedSpecialties")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.suggestedSpecialties.map((s, i) => (
                <Badge key={i} variant="info">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {data.suggestedDoctors.length > 0 && (
          <div>
            <p className="mb-1.5 text-sm font-semibold text-slate-800">
              {t("assistant.availableDoctors")}
            </p>
            <div className="space-y-2">
              {data.suggestedDoctors.map((doc) => (
                <div
                  key={`${doc.doctorInstitutionId}-${doc.specialtyId}`}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">
                      {t("assistant.doctorPrefix")} {doc.fullName}
                    </p>
                    <p className="text-sm text-slate-600">{doc.specialty}</p>
                    <p className="text-xs text-slate-500">
                      {[doc.institutionName, doc.institutionCity]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <div className="mt-1">
                      {doc.hasAvailabilityToday ? (
                        <Badge variant="success">{t("assistant.availableToday")}</Badge>
                      ) : (
                        <Badge variant="default">{t("assistant.noSlotsToday")}</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-sm"
                    onClick={() => goToAppointment(doc)}
                  >
                    {t("assistant.book")}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.disclaimer && (
          <p className="border-t border-slate-100 pt-2 text-xs text-slate-400">
            {data.disclaimer}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {t("assistant.title")}
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">{t("assistant.intro")}</p>
        </div>

        <div
          ref={scrollRef}
          className="max-h-[58vh] min-h-[320px] space-y-4 overflow-y-auto bg-slate-50 px-4 py-4"
        >
          {turns.length === 0 && (
            <div className="mx-auto max-w-md py-6 text-center">
              <p className="text-sm text-slate-600">
                {t("assistant.startExample")}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {examplePrompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => void send(p)}
                    disabled={loading}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns.map((turn) => (
            <div
              key={turn.id}
              className={
                turn.role === "user" ? "flex justify-end" : "flex justify-start"
              }
            >
              <div
                className={
                  turn.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-white"
                    : "max-w-[90%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3"
                }
              >
                {turn.role === "user" ? (
                  <p className="whitespace-pre-line">{turn.content}</p>
                ) : (
                  renderAssistantTurn(turn)
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                {t("assistant.analyzing")}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 border-t border-slate-200 p-3"
        >
          <div className="flex-1">
            <Textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("assistant.inputPlaceholder")}
              disabled={loading}
            />
          </div>
          <Button type="submit" loading={loading} disabled={!input.trim()}>
            {t("assistant.send")}
          </Button>
        </form>
      </Card>
    </div>
  );
};
