import { supabase } from './supabaseClient';

export async function uploadUri(
  bucket: 'swing-clips' | 'tpi-clips' | 'scorecards' | 'coach-lessons',
  path: string,
  uri: string,
  contentType: string,
): Promise<string> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Could not read file (${response.status})`);
  }
  const blob = await response.blob();
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
