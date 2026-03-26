// components/LinkifyDescription.tsx
import React from "react";

interface LinkifyDescriptionProps {
  text: string;
  className?: string;
}

const LinkifyDescription: React.FC<LinkifyDescriptionProps> = ({
  text,
  className = "",
}) => {
  if (!text) return null;

  // Regex mejorada para URLs (http/https, no captura puntuación final)
  const urlRegex =
    /(https?:\/\/[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;

  const parts = text.split(urlRegex);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--cAccent)",
              textDecoration: "underline",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
};

export default LinkifyDescription;
