export interface Product {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    rating: number;
    reviewCount: number;
    category: string;
    image?: string;
    images?: string[];
    description?: string;
    tags?: string[];
    seller: {
        id: string;
        name: string;
        location: string;
    };
}

export const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
    }).format(price);
};

export const categories = [
    { id: 'makanan', name: 'Makanan', icon: '🍔', count: 120 },
    { id: 'minuman', name: 'Minuman', icon: '🥤', count: 85 },
    { id: 'kerajinan', name: 'Kerajinan', icon: '🧶', count: 45 },
    { id: 'pakaian', name: 'Pakaian', icon: '👕', count: 200 },
];

export const allProducts: Product[] = [
    {
        id: '1',
        name: 'Kopi Susu Gula Aren',
        price: 15000,
        originalPrice: 20000,
        rating: 4.8,
        reviewCount: 324,
        category: 'minuman',
        image: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=500&q=80',
        images: ['https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=500&q=80'],
        description: 'Kopi susu khas dengan gula aren asli.',
        tags: ['kopi', 'minuman', 'manis'],
        seller: { id: 's1', name: 'Kopi Kenangan', location: 'Jakarta' }
    },
    {
        id: '2',
        name: 'Nasi Goreng Spesial',
        price: 25000,
        rating: 4.5,
        reviewCount: 128,
        category: 'makanan',
        image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&q=80',
        images: ['https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&q=80'],
        description: 'Nasi goreng dengan telur dan ayam.',
        tags: ['makanan', 'gurih'],
        seller: { id: 's2', name: 'Warung Nasi', location: 'Bandung' }
    }
];

export const featuredProducts = allProducts;
