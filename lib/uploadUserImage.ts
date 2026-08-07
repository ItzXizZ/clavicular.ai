import { createClient } from '@supabase/supabase-js';

/** Upload a data URL or raw base64 image to Supabase; returns a durable public URL. */
export async function uploadUserImage(
  image: string,
  userId: string,
  folder: 'physique' | 'fashion' | 'wardrobe' | 'transforms'
): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceKey) {
    return image.startsWith('data:') ? image : image;
  }

  try {
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    const contentType = match?.[1] || 'image/jpeg';
    const base64 = match?.[2] || image.replace(/^data:image\/\w+;base64,/, '');
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const buffer = Buffer.from(base64, 'base64');
    const fileName = `${folder}/${userId}/${Date.now()}.${ext}`;

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data, error } = await supabase.storage
      .from('leaderboard-faces')
      .upload(fileName, buffer, { contentType, upsert: true });

    if (error) {
      console.error('[uploadUserImage]', error);
      return image.startsWith('http') ? image : `data:${contentType};base64,${base64}`;
    }

    const { data: urlData } = supabase.storage
      .from('leaderboard-faces')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (err) {
    console.error('[uploadUserImage] failed', err);
    return image.startsWith('http') ? image : null;
  }
}
