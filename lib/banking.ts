/**
 * Shared utility for identifying Argentine banks based on CBU/CVU prefixes or Alias patterns.
 */

// Official CBU/CVU prefixes for primary Argentine banks
const BANK_CODES: Record<string, string> = {
    '007': 'Banco Galicia',
    '011': 'Banco Nación',
    '014': 'Banco Provincia',
    '015': 'ICBC',
    '016': 'Citibank',
    '017': 'BBVA',
    '020': 'Banco de Córdoba',
    '027': 'Banco Supervielle',
    '029': 'Banco Ciudad',
    '034': 'Banco Patagonia',
    '044': 'Banco Hipotecario',
    '045': 'Banco de San Juan',
    '065': 'Banco Municipal de Rosario',
    '072': 'Santander',
    '083': 'Banco del Chubut',
    '086': 'Banco de Santa Cruz',
    '093': 'Banco de La Pampa',
    '094': 'Banco de Corrientes',
    '097': 'Banco de Neuquén',
    '143': 'Brubank (CBU)',
    '150': 'HSBC',
    '191': 'Banco Credicoop',
    '285': 'Banco Macro',
    '299': 'Banco Comafi',
    '000': 'Cuenta Virtual (CVU)',
};

/**
 * MOCK DATABASE 
 * Add your real Aliases or CBUs here for the demo to show specific real data.
 */
const MOCK_ACCOUNTS: Record<string, { bank: string, holder: string }> = {
    'serie.metro.lupa': {
        bank: 'Banco Ciudad',
        holder: 'LUCAS ADRIAN PULIDO'
    },
    'karina.ziffer.mp': {
        bank: 'Mercado Pago',
        holder: 'KARINA ZIFFER'
    }
};

/**
 * Validates the checksum of a 22-digit CBU/CVU.
 */
export const validateCbuChecksum = (cbu: string): boolean => {
    if (!/^\d{22}$/.test(cbu)) return false;

    const block1 = cbu.substring(0, 8);
    const block2 = cbu.substring(8, 22);

    const validateBlock = (block: string, weights: number[]) => {
        let sum = 0;
        for (let i = 0; i < weights.length; i++) {
            sum += parseInt(block[i]) * weights[i];
        }
        const digit = (10 - (sum % 10)) % 10;
        return digit === parseInt(block[weights.length]);
    };

    const weights1 = [7, 1, 3, 9, 7, 1, 3];
    const weights2 = [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3];

    return validateBlock(block1, weights1) && validateBlock(block2, weights2);
};

export const identifyBank = (cbuOrAlias: string): string => {
    const clean = cbuOrAlias.trim();
    const lower = clean.toLowerCase();

    // 1. Check Mock Database first
    if (MOCK_ACCOUNTS[lower]) return MOCK_ACCOUNTS[lower].bank;

    // 2. CBU/CVU Detection (22 digits)
    if (/^\d{22}$/.test(clean)) {
        if (!validateCbuChecksum(clean)) return 'CBU Inválido (Error de Checksum)';

        const prefix = clean.substring(0, 3);

        // Fintech long prefixes
        if (clean.startsWith('00000031')) return 'Mercado Pago';
        if (clean.startsWith('00000079')) return 'Ualá';
        if (clean.startsWith('00000067')) return 'Brubank';
        if (clean.startsWith('00000045')) return 'Naranja X';

        return BANK_CODES[prefix] || 'Entidad Bancaria';
    }

    // 3. Alias Detection
    if (lower.includes('.')) {
        if (lower.endsWith('.mp')) return 'Mercado Pago';
        if (lower.endsWith('.bru')) return 'Brubank';
        if (lower.endsWith('.uala')) return 'Ualá';
        if (lower.endsWith('.nx') || lower.endsWith('.naranja')) return 'Naranja X';
        if (lower.endsWith('.reba')) return 'Reba';

        const parts = lower.split('.');
        if (parts.length === 3) return 'Entidad Bancaria (Alias CBU)';

        return 'Entidad por Validar (API Coelsa)';
    }

    return 'Entidad Desconocida';
};

export const identifyHolder = (input: string, currentUserDisplayName?: string): string => {
    const clean = input.trim();
    const lower = clean.toLowerCase();

    // 1. Check Mock Database first
    if (MOCK_ACCOUNTS[lower]) return MOCK_ACCOUNTS[lower].holder;

    // 2. Extract from personalized alias
    if (lower.includes('.') && !/^\d+$/.test(clean) && lower.split('.').length < 3) {
        const parts = lower.split('.');
        const nameParts = parts.filter(p =>
            p.length > 2 &&
            !['mp', 'bru', 'uala', 'nx', 'naranja', 'pagos', 'bank', 'cash', 'reba'].includes(p)
        );

        if (nameParts.length >= 1) return nameParts.map(p => p.toUpperCase()).join(' ');
    }

    // 3. System aliases or CBU
    return currentUserDisplayName?.toUpperCase() || 'TITULAR VERIFICADO';
};
