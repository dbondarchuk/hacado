export const richTextArgs = {
  br: () => <br />,
  p: (chunks: any) => <p>{chunks}</p>,
  ul: (chunks: any) => <ul className="list-inside list-disc">{chunks}</ul>,
  ol: (chunks: any) => <ol className="list-inside list-decimal">{chunks}</ol>,
  li: (chunks: any) => <li>{chunks}</li>,
  b: (chunks: any) => <b>{chunks}</b>,
  i: (chunks: any) => <i>{chunks}</i>,
  s: (chunks: any) => <s>{chunks}</s>,
  u: (chunks: any) => <u>{chunks}</u>,
  strong: (chunks: any) => <strong>{chunks}</strong>,
  em: (chunks: any) => <em>{chunks}</em>,
  sup: (chunks: any) => <sup>{chunks}</sup>,
  sub: (chunks: any) => <sub>{chunks}</sub>,
  small: (chunks: any) => <small>{chunks}</small>,
  span: (chunks: any) => <span>{chunks}</span>,
  div: (chunks: any) => <div>{chunks}</div>,
  hr: () => <hr />,
  blockquote: (chunks: any) => <blockquote>{chunks}</blockquote>,
  code: (chunks: any) => (
    <code className="bg-muted text-muted-foreground text-mono px-1 py-0.5 rounded-sm">
      {chunks}
    </code>
  ),
};
