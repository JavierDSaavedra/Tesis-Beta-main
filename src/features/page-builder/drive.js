export const DRIVE_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_GOOGLE_DRIVE_API_KEY) || '';

export function extractDriveFolderId(input) {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return trimmed;
}

export function buildDriveThumbnailUrl(fileId, size = 1600) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
}

export async function fetchDriveFolderImages({ folderId, apiKey, filenames }) {
  if (!folderId || !apiKey || !filenames || filenames.length === 0) {
    return [];
  }

  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&key=${apiKey}&fields=files(id,name)&pageSize=1000`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error al consultar Google Drive (${res.status})`);
  }

  const data = await res.json();
  const files = data.files || [];

  return filenames
    .map((name) => {
      const file = files.find((f) => f.name === name);
      return file ? { name, url: buildDriveThumbnailUrl(file.id) } : null;
    })
    .filter(Boolean);
}
