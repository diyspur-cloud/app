type JsonLdProps = {
  data: Record<string, unknown>;
  nonce?: string;
};

export function JsonLd({ data, nonce }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
