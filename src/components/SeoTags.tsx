import { Helmet } from "react-helmet-async";

type Props = {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
};

const DEFAULT_IMAGE = "https://garage.app/og-garage.jpg";

/**
 * Tags SEO + Open Graph + Twitter Card.
 *
 * Importante: a maioria dos crawlers (Facebook, WhatsApp, LinkedIn) NÃO executam JS,
 * então essas tags só funcionam em visualizadores que avaliam JS (alguns previews
 * modernos). Para garantir preview correto em todos os canais, use a Edge Function
 * `og-preview` no link compartilhado.
 */
export function SeoTags({ title, description, image, url, type = "website" }: Props) {
  const finalImage = image && /^https?:\/\//i.test(image) ? image : DEFAULT_IMAGE;
  const finalUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:image:secure_url" content={finalImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      {finalUrl && <meta property="og:url" content={finalUrl} />}
      <meta property="og:site_name" content="Garage" />
      <meta property="og:locale" content="pt_BR" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={finalImage} />

      {finalUrl && <link rel="canonical" href={finalUrl} />}
    </Helmet>
  );
}
