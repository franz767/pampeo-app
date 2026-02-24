import { supabase } from './supabase';

export const storageService = {
  async uploadCanchaImage(uri: string, canchaId: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();

    const fileName = `${canchaId}/${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from('canchas-fotos')
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg',
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from('canchas-fotos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },
};
