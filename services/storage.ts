
import { supabase } from '../lib/supabase';

/**
 * Uploads a vehicle photo to Supabase Storage
 * @param file The file to upload
 * @param vehiclePlaca The vehicle license plate (used for filename)
 * @returns The public URL of the uploaded image
 */
export async function uploadVehiclePhoto(file: File, vehiclePlaca: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${vehiclePlaca}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('veiculos')
        .upload(filePath, file);

    if (uploadError) {
        throw uploadError;
    }

    const { data } = supabase.storage
        .from('veiculos')
        .getPublicUrl(filePath);

    return data.publicUrl;
}
