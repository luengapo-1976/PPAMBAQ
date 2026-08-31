/** Normaliza links de YouTube/Vimeo a su URL de embed. Devuelve null si la URL
 * no matchea ningún patrón conocido — quien la consuma debe mostrar un enlace
 * "Ver video" en vez de un iframe roto. */
export function getEmbedUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  const youtubeId = extractYoutubeId(url);
  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}`;
  }

  const vimeoMatch = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return null;
}

/** Miniatura estática de YouTube sin necesidad de API key. Vimeo no ofrece un
 * equivalente sin llamar a su API oEmbed, así que solo se resuelve para YouTube. */
export function getYoutubeThumbnail(url: string | null | undefined): string | null {
  const id = extractYoutubeId(url ?? '');
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

function extractYoutubeId(url: string): string | null {
  const match =
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{6,})/.exec(url);
  return match ? match[1] : null;
}
