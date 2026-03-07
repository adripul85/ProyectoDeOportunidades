import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { getProduct, ItemData } from '../lib/items';
import { getUserProfile } from '../lib/users';
import { db } from '../lib/firebase';

export const useProduct = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notify } = useNotification();

    const [activeImg, setActiveImg] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [showFullscreen, setShowFullscreen] = useState(false);
    const [showButtonTooltip, setShowButtonTooltip] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState<(ItemData & { id: string, seller: any, images: string[] }) | null>(null);
    const imageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            setLoading(true);
            const data = await getProduct(id);
            if (data) {
                // Increment views
                import("firebase/firestore").then(({ updateDoc, doc, increment }) => {
                    updateDoc(doc(db, "items", id), { views: increment(1) });
                });

                const sellerData = await getUserProfile(data.sellerId);
                setProduct({
                    ...data,
                    seller: sellerData ? {
                        ...sellerData,
                        id: data.sellerId,
                        displayName: sellerData.displayName || 'Comerciante de la Red',
                        avatar: sellerData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerData.displayName || 'V')}&background=random`,
                        responseTime: sellerData.responseTime || 'No especificado'
                    } : {
                        id: data.sellerId,
                        displayName: 'Usuario de la Red',
                        reputation: { averageRating: 0, totalReviews: 0 },
                        avatar: `https://ui-avatars.com/api/?name=U&background=random`,
                        responseTime: 'Pendiente de sincronización'
                    }
                });
            }
            setLoading(false);
        };
        fetchProduct();
    }, [id]);

    // Helper to generate deterministic fake name from ID
    const getFakeName = (id: string) => {
        const names = ["Martín Silva", "Sofía Lopez", "Juan Perez", "Lucía Gómez", "Carlos Ruiz", "Ana Martínez", "Diego Torres", "Valentina Diaz", "Gabriel Fernandez", "Camila Rodriguez", "Lucas Benitez", "Maria Garcia"];
        const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % names.length;
        return names[index];
    };

    // Fallback product for initial render or error (preventing breaks)
    const displayProduct = product || {
        title: "Cargando activo...",
        price: 0,
        category: "...",
        condition: "...",
        description: "Obteniendo especificaciones del servidor seguro...",
        images: ["https://picsum.photos/1200/900?tech"],
        seller: { id: "unknown", name: "...", reputation: { averageRating: 0, totalReviews: 0 }, avatar: "", deals: 0, responseTime: "...", yearsInPlatform: "...", status: "...", phrase: "..." }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imageRef.current) return;
        const { left, top, width, height } = imageRef.current.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setMousePos({ x, y });
    };

    const buyNow = () => {
        if (!product || !id) return;

        notify({
            type: 'info',
            title: 'Iniciando Compra 🎯',
            message: 'Te llevamos al checkout seguro.',
            icon: 'shopping_cart_checkout'
        });

        navigate('/checkout', {
            state: {
                productId: id,
                productTitle: product.title,
                productPrice: product.price,
                sellerId: product.sellerId || 'unknown',
                sellerName: product.seller.displayName,
                sellerAvatar: product.seller.avatar
            }
        });
    };

    const contactSeller = () => {
        if (!product || !id) return;

        navigate('/new-trato', {
            state: {
                productTitle: product.title,
                productPrice: product.price,
                sellerName: product.seller.displayName,
                sellerAvatar: product.seller.avatar
            }
        });
    };

    return {
        product: displayProduct,
        loading,
        activeImg,
        setActiveImg,
        isHovered,
        setIsHovered,
        mousePos,
        showFullscreen,
        setShowFullscreen,
        showButtonTooltip,
        setShowButtonTooltip,
        isShareModalOpen,
        setIsShareModalOpen,
        imageRef,
        handleMouseMove,
        buyNow,
        contactSeller
    };
};
