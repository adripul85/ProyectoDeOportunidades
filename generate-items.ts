// Script para generar artículos de prueba en Firestore
// Ejecutar con: node --loader ts-node/esm generate-items.ts

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAxlmDDOHY3D27hGVhYZCnwRVupOn9gt3w",
    authDomain: "deoportunidades.firebaseapp.com",
    projectId: "deoportunidades",
    storageBucket: "deoportunidades.firebasestorage.app",
    messagingSenderId: "194924574195",
    appId: "1:194924574195:web:4166c84b1fe8f9487ace86",
    measurementId: "G-7GC2SXDNM5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Datos de ejemplo
const categories = ['Electrónica', 'Muebles', 'Ropa', 'Deportes', 'Libros', 'Juguetes', 'Herramientas', 'Hogar'];

const conditions = ['Nuevo', 'Como Nuevo', 'Usado - Buen Estado', 'Usado - Aceptable'];

const productNames = {
    'Electrónica': ['iPhone', 'Samsung Galaxy', 'Laptop Dell', 'MacBook Pro', 'iPad', 'AirPods', 'Monitor LG', 'Mouse Logitech', 'Teclado Mecánico', 'Webcam HD'],
    'Muebles': ['Silla Gamer', 'Escritorio', 'Mesa de Comedor', 'Sofá', 'Cama', 'Estantería', 'Sillón', 'Armario', 'Mesa de Luz', 'Biblioteca'],
    'Ropa': ['Zapatillas Nike', 'Campera', 'Jean Levis', 'Remera', 'Buzo', 'Pantalón', 'Vestido', 'Camisa', 'Short', 'Medias'],
    'Deportes': ['Bicicleta', 'Pelota de Fútbol', 'Raqueta de Tenis', 'Pesas', 'Colchoneta Yoga', 'Cinta Correr', 'Skate', 'Patines', 'Bolso Gym', 'Guantes Box'],
    'Libros': ['Harry Potter', 'El Señor de los Anillos', 'Cien Años de Soledad', '1984', 'Don Quijote', 'Rayuela', 'Ficciones', 'El Alquimista', 'El Código Da Vinci', 'Sapiens'],
    'Juguetes': ['Lego Star Wars', 'Muñeca Barbie', 'Hot Wheels', 'Puzzle 1000 piezas', 'Pelota', 'Avión RC', 'Auto RC', 'Peluche', 'Juego de Mesa', 'Drone'],
    'Herramientas': ['Taladro', 'Destornillador Set', 'Martillo', 'Sierra', 'Llave Inglesa', 'Nivel', 'Lijadora', 'Compresor', 'Soldadora', 'Amoladora'],
    'Hogar': ['Licuadora', 'Cafetera', 'Microondas', 'Aspiradora', 'Ventilador', 'Plancha', 'Tostadora', 'Batidora', 'Freidora Aire', 'Purificador']
};

const descriptions = [
    'Producto en excelente estado, poco uso. Incluye todos los accesorios originales.',
    'Artículo prácticamente nuevo, usado solo 2 veces. Sin detalles ni rayones.',
    'Muy buen estado general, funcionando perfectamente. Listo para usar.',
    'Producto usado pero bien cuidado. Algunas marcas de uso normal pero funciona perfecto.',
    'Excelente oportunidad! Precio negociable. Entrega inmediata en CABA.',
    'Impecable estado, como recién comprado. Factura y garantía incluida.',
    'Artículo de calidad, marca reconocida. Ideal para uso diario.',
    'Última unidad disponible! Estado: como nuevo. No te lo pierdas.',
    'Producto de primera calidad. Funcionamiento verificado y testeado.',
    'Oportunidad única! Precio especial por venta rápida.'
];

const sellerIds = [
    'seller1_test_uid',
    'seller2_test_uid',
    'seller3_test_uid',
    'seller4_test_uid',
    'seller5_test_uid'
];

const sellerNames = [
    'Juan García',
    'María López',
    'Carlos Rodríguez',
    'Ana Martínez',
    'Luis Fernández'
];

// Imágenes de placeholder (usando Unsplash)
const getPlaceholderImage = (category: string) => {
    const queries: Record<string, string> = {
        'Electrónica': 'electronics,gadgets,tech',
        'Muebles': 'furniture,interior,home',
        'Ropa': 'clothing,fashion,apparel',
        'Deportes': 'sports,fitness,exercise',
        'Libros': 'books,reading,library',
        'Juguetes': 'toys,kids,play',
        'Herramientas': 'tools,hardware,workshop',
        'Hogar': 'home,appliances,household'
    };

    const query = queries[category] || 'product';
    const randomSeed = Math.floor(Math.random() * 1000);
    return `https://source.unsplash.com/800x600/?${query}&sig=${randomSeed}`;
};

// Función para generar precio aleatorio según categoría
const generatePrice = (category: string): number => {
    const priceRanges: Record<string, [number, number]> = {
        'Electrónica': [5000, 150000],
        'Muebles': [10000, 80000],
        'Ropa': [1000, 20000],
        'Deportes': [2000, 50000],
        'Libros': [500, 5000],
        'Juguetes': [1000, 15000],
        'Herramientas': [3000, 40000],
        'Hogar': [5000, 60000]
    };

    const [min, max] = priceRanges[category] || [1000, 50000];
    return Math.floor(Math.random() * (max - min) + min);
};

// Generar un item aleatorio
const generateRandomItem = (index: number) => {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const productList = productNames[category];
    const productName = productList[Math.floor(Math.random() * productList.length)];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    const sellerIndex = Math.floor(Math.random() * sellerIds.length);
    const price = generatePrice(category);

    const item = {
        title: `${productName} ${index + 1}`,
        description: description,
        price: price,
        category: category,
        condition: condition,
        images: [
            getPlaceholderImage(category),
            getPlaceholderImage(category),
            getPlaceholderImage(category)
        ],
        sellerId: sellerIds[sellerIndex],
        sellerName: sellerNames[sellerIndex],
        status: 'available',
        createdAt: serverTimestamp(),
        featured: Math.random() > 0.8, // 20% featured
        views: Math.floor(Math.random() * 200)
    };

    return item;
};

// Función principal
async function generateItems() {
    console.log('🚀 Iniciando generación de artículos...\n');

    try {
        for (let i = 0; i < 50; i++) {
            const item = generateRandomItem(i);
            const docRef = await addDoc(collection(db, 'items'), item);
            console.log(`✅ [${i + 1}/50] Creado: ${item.title} - $${item.price.toLocaleString()} (ID: ${docRef.id})`);
        }

        console.log('\n🎉 ¡Generación completada exitosamente!');
        console.log('📊 Total de artículos creados: 50');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al generar artículos:', error);
        process.exit(1);
    }
}

// Ejecutar
generateItems();
