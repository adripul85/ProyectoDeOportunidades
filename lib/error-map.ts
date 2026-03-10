/**
 * Mapea códigos de error de Firebase a mensajes amigables para el usuario.
 */
export const mapAuthError = (errorCode: string): string => {
    switch (errorCode) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
            return 'El correo o la contraseña no son correctos.';
        case 'auth/email-already-in-use':
            return 'Este correo electrónico ya está registrado. Prueba con otro o inicia sesión.';
        case 'auth/weak-password':
            return 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
        case 'auth/invalid-email':
            return 'El formato del correo electrónico no es válido.';
        case 'auth/user-disabled':
            return 'Esta cuenta ha sido deshabilitada por seguridad.';
        case 'auth/operation-not-allowed':
            return 'El inicio de sesión con este método no está habilitado actualmente.';
        case 'auth/too-many-requests':
            return 'Demasiados intentos fallidos. Por favor, intenta de nuevo en unos minutos.';
        case 'auth/network-request-failed':
            return 'Error de conexión. Revisa tu internet e intenta de nuevo.';
        case 'auth/popup-closed-by-user':
            return 'Se cerró la ventana de Google antes de completar el inicio de sesión.';
        default:
            return 'Ocurrió un error inesperado al validar tus datos. Intenta de nuevo.';
    }
};
