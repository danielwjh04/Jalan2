import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { postMenu, postMenuDemo } from './api';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.5,
  base64: true,
};

export type MenuSource = 'camera' | 'library' | 'demo';

async function pickPhoto(source: MenuSource): Promise<ImagePicker.ImagePickerResult> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return { canceled: true, assets: null };
    return ImagePicker.launchCameraAsync(PICKER_OPTIONS);
  }
  return ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
}

// The menu twin of ingestVideo: camera and library both land here, the photo
// goes to the backend, and the app navigates to the resulting swipe deck.
export async function scanMenu(source: MenuSource): Promise<boolean> {
  if (source === 'demo') {
    const menu = await postMenuDemo();
    router.push(`/menu/${menu.id}`);
    return true;
  }
  const result = await pickPhoto(source);
  const asset = result.canceled ? null : result.assets[0];
  if (!asset?.base64) return false;
  const mimeType = asset.mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
  const menu = await postMenu({ imageBase64: asset.base64, mimeType });
  router.push(`/menu/${menu.id}`);
  return true;
}
