import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../App';
import { getProduct, ItemData } from '../lib/items';
import { getUserProfile } from '../lib/users';

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
                const sellerData = await getUserProfile(data.sellerId);
                setProduct({
                    ...data,
                    seller: sellerData || {
                        name: "Vendedor Verificado",
                        reputation: "0.0",
                        avatar: "https://picsum.photos/100/100?avatar=seller",
                        deals: 0,
                        responseTime: "---",
                        yearsInPlatform: "Unknown",
                        status: "Regular",
                        phrase: "---"
                    }
                });
            }
            setLoading(false);
        };
        fetchProduct();
    }, [id]);

    // Fallback product for initial render or error (preventing breaks)
    const displayProduct = product || {
        title: "Cargando activo...",
        price: 0,
        category: "...",
        condition: "...",
        description: "Obteniendo especificaciones del servidor seguro...",
        images: ["https://picsum.photos/1200/900?tech"],
        seller: { name: "...", reputation: "0.0", avatar: "", deals: 0, responseTime: "...", yearsInPlatform: "...", status: "...", phrase: "..." }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imageRef.current) return;
        const { left, top, width, height } = imageRef.current.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setMousePos({ x, y });
    };

    const startDeal = () => {
        if (!product || !id) return;

        notify({
            type: 'info',
            title: '¡Excelente elección! 🎯',
            message: 'Te llevamos al checkout seguro.',
            icon: 'shopping_cart_checkout'
        });

        navigate('/checkout', {
            state: {
                productId: id,
                productTitle: product.title,
                productPrice: product.price,
                sellerId: product.sellerId || 'unknown'
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
        startDeal
    };
};
