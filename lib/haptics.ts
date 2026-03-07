/**
 * Utilidad para invocar feedback táctil (vibración) en dispositivos que lo soporten (principalmente Android web).
 * Emula la experiencia de Expo Haptics en la web.
 */
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof window === 'undefined' || !navigator || !navigator.vibrate) return;

    try {
        switch (type) {
            case 'light':
                // Una vibración muy suave (ideal para touch general)
                navigator.vibrate(10);
                break;
            case 'medium':
                // Vibración firme (ideal para acciones secundarias o advertencias)
                navigator.vibrate(40);
                break;
            case 'heavy':
                // Vibración fuerte o patrón (ideal para acciones destructivas o éxitos importantes)
                navigator.vibrate([30, 50, 30]);
                break;
            default:
                navigator.vibrate(10);
        }
    } catch (e) {
        // Ignorar errores silenciosamente si el dispositivo no lo soporta
        console.debug("Haptics no soportado en este dispositivo");
    }
};
