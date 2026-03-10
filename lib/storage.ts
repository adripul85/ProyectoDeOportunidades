import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Uploads a file to Firebase Storage and returns its download URL.
 * @param file The file to upload
 * @param path The path in storage (e.g., 'items/unique-id.jpg')
 */
export const uploadFile = async (file: File | Blob, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    
    // Explicitly set content type from the file/blob
    const metadata = {
        contentType: (file as any).type || 'image/jpeg'
    };
    
    await uploadBytes(storageRef, file, metadata);
    return getDownloadURL(storageRef);
};
