import { useMemo } from "react";
import { motion } from "framer-motion";

const escapeHtml = (str = "") =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatInline = (text = "") => {
  let escaped = escapeHtml(text);
  escaped = escaped.replace(
    /\[([^\]]+?)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer">$1</a>'
  );
  escaped = escaped.replace(
    /`([^`]+?)`/g,
    '<code class="inline-code">$1</code>'
  );
  escaped = escaped.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");
  escaped = escaped.replace(/\*([^*]+?)\*/g, "<em>$1</em>");
  escaped = escaped.replace(/_([^_]+?)_/g, "<em>$1</em>");
  return escaped;
};

const renderMarkdown = (markdown = "") => {
  if (!markdown.trim()) return "";

  const lines = markdown.split(/\r?\n/);
  let html = "";
  let paragraph = [];
  let listType = null;
  let listItems = [];
  let inCode = false;
  let codeBuffer = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html += `<p>${formatInline(paragraph.join(" ").trim())}</p>`;
    paragraph = [];
  };

  const flushList = () => {
    if (!listType) return;
    html += `<${listType}>${listItems
      .map((item) => `<li>${formatInline(item.trim())}</li>`)
      .join("")}</${listType}>`;
    listType = null;
    listItems = [];
  };

  const flushCode = () => {
    if (!inCode) return;
    html += `<pre class="code-block"><code>${escapeHtml(
      codeBuffer.join("\n")
    )}</code></pre>`;
    codeBuffer = [];
    inCode = false;
  };

  for (const rawLine of lines) {
    const line = rawLine ?? "";

    if (/^```/.test(line)) {
      if (inCode) {
        flushCode();
      } else {
        flushParagraph();
        flushList();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = Math.min(headingMatch[1].length, 6);
      html += `<h${level}>${formatInline(headingMatch[2].trim())}</h${level}>`;
      continue;
    }

    if (/^([-*_]\s*){3,}$/.test(line.trim())) {
      flushParagraph();
      flushList();
      html += "<hr />";
      continue;
    }

    const quoteMatch = line.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      html += `<blockquote>${formatInline(quoteMatch[1])}</blockquote>`;
      continue;
    }

    const orderedMatch = line.match(/^\d+[.)]\s+(.*)$/);
    if (orderedMatch) {
      flushParagraph();
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listItems.push(orderedMatch[1]);
      continue;
    }

    const bulletMatch = line.match(/^[-*+]\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listItems.push(bulletMatch[1]);
      continue;
    }

    paragraph.push(line.trim());
  }

  flushCode();
  flushParagraph();
  flushList();

  return html || formatInline(markdown);
};

export default function ResultViewer({ result, onReset }) {
  const MotionPanel = motion.div;
  const containerProps = {
    className: "panel result-panel",
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
  };

  const parsedResult = useMemo(() => renderMarkdown(result || ""), [result]);

  return (
    <MotionPanel {...containerProps}>
      <div className="panel-head">
        <div>
          <p className="eyebrow">결과</p>
          <h2>AI 분석 결과</h2>
        </div>
        <div className="panel-actions">
          <button className="ghost-btn" onClick={onReset}>
            닫기
          </button>
          <button className="ghost-btn" onClick={onReset}>
            새 분석하기
          </button>
        </div>
      </div>
      <div className="result-box">
        {result ? (
          <div
            className="result-markdown"
            dangerouslySetInnerHTML={{ __html: parsedResult }}
          />
        ) : (
          "아직 분석된 결과가 없습니다."
        )}
      </div>
    </MotionPanel>
  );
}
