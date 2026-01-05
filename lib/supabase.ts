import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client (for browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to upload image to Supabase storage
export async function uploadLeaderboardImage(
  base64Image: string, 
  fileName: string
): Promise<string | null> {
  try {
    // Convert base64 to blob
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Determine content type
    const contentType = base64Image.startsWith('data:image/png') 
      ? 'image/png' 
      : 'image/jpeg';

    const { data, error } = await supabase.storage
      .from('leaderboard-faces')
      .upload(fileName, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('leaderboard-faces')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}

// Helper function to delete image from Supabase storage
export async function deleteLeaderboardImage(fileName: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('leaderboard-faces')
      .remove([fileName]);

    if (error) {
      console.error('Supabase delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}
