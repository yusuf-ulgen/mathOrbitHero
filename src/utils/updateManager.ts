import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { APP_RELEASE_NOTES } from './releaseNotes';

const LAST_LAUNCHED_VERSION_KEY = '@last_launched_version';

export interface UpdateData {
  latestVersion: string;
  releaseNotes: string;
  storeUrl: string;
  isMandatory: boolean;
}

export const getCurrentVersion = () => {
  return Constants.expoConfig?.version || '1.0.0';
};

export const checkAppStatus = async () => {
  const currentVersion = getCurrentVersion();
  let lastLaunchedVersion = null;
  
  try {
    lastLaunchedVersion = await AsyncStorage.getItem(LAST_LAUNCHED_VERSION_KEY);
  } catch (error) {
    console.error("AsyncStorage error:", error);
  }
  
  let showUpdateDetails = false;
  
  // Uygulama güncellenmiş mi?
  // Eğer daha önce açılmışsa ve kaydedilen versiyon şu anki versiyondan farklıysa güncellenmiştir.
  if (lastLaunchedVersion && lastLaunchedVersion !== currentVersion) {
    showUpdateDetails = true;
  }

  // İlk açılış veya güncellenmiş açılış için versiyonu kaydet
  if (lastLaunchedVersion !== currentVersion) {
    try {
      await AsyncStorage.setItem(LAST_LAUNCHED_VERSION_KEY, currentVersion);
    } catch (error) {
      console.error("AsyncStorage save error:", error);
    }
  }

  return {
    showUpdateDetails,
    updateAvailable: false, // İnternetten çekmediğimiz için yeni güncellemeyi önceden haber veremeyiz.
    updateData: {
      latestVersion: currentVersion,
      releaseNotes: APP_RELEASE_NOTES.notes,
      storeUrl: "",
      isMandatory: false
    },
    currentVersion
  };
};
