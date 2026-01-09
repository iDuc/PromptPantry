import { createClient } from './client';

const BUCKET_NAME = 'result-images';

export async function uploadImage(file: File): Promise<string | null> {
  const supabase = createClient();

  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file);

  if (error) {
    console.error('Error uploading image:', error);
    return null;
  }

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function deleteImage(url: string): Promise<boolean> {
  const supabase = createClient();

  // Extract file path from URL
  const urlParts = url.split('/');
  const filePath = urlParts[urlParts.length - 1];

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.error('Error deleting image:', error);
    return false;
  }

  return true;
}

export function getImageUrl(path: string): string {
  const supabase = createClient();
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);
  return data.publicUrl;
}
