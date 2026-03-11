import { supabase } from './supabase';

export const storageService = {
  async uploadAvatar(userId: string, uri: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();

    const fileName = `${userId}/${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg',
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

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

  async uploadComprobante(reservaId: string, uri: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();

    const fileName = `${reservaId}/${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from('comprobantes-yape')
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg',
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from('comprobantes-yape')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },
};
