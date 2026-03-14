export const guideCategories = [
    {
        id: 'getting-started',
        icon: 'rocket',
        title: {
            en: 'Getting Started',
            id: 'Memulai'
        },
        description: {
            en: 'Learn the basics of using the app',
            id: 'Pelajari dasar-dasar penggunaan aplikasi'
        },
        articles: [
            {
                id: 'create-account',
                title: {
                    en: 'How to Create an Account',
                    id: 'Cara Membuat Akun'
                },
                content: {
                    en: [
                        { type: 'text', text: 'Creating an account on MSME Marketplace is easy and free. Follow these steps to get started:' },
                        { type: 'step', text: 'Tap the "Daftar" or "Sign Up" button on the home screen' },
                        { type: 'step', text: 'Fill in your email address and create a password' },
                        { type: 'step', text: 'Enter your full name and phone number' },
                        { type: 'step', text: 'Verify your email address by clicking the link sent to your inbox' },
                        { type: 'tip', text: 'Tip: Use a valid email address as it will be used for order notifications and password recovery.' }
                    ],
                    id: [
                        { type: 'text', text: 'Membuat akun di MSME Marketplace mudah dan gratis. Ikuti langkah-langkah berikut untuk memulai:' },
                        { type: 'step', text: 'Ketuk tombol "Daftar" atau "Sign Up" di layar utama' },
                        { type: 'step', text: 'Masukkan alamat email Anda dan buat kata sandi' },
                        { type: 'step', text: 'Masukkan nama lengkap dan nomor telepon Anda' },
                        { type: 'step', text: 'Verifikasi alamat email Anda dengan mengklik tautan yang dikirim ke kotak masuk Anda' },
                        { type: 'tip', text: 'Tips: Gunakan alamat email yang valid karena akan digunakan untuk notifikasi pesanan dan pemulihan kata sandi.' }
                    ]
                }
            },
            {
                id: 'login',
                title: {
                    en: 'How to Login',
                    id: 'Cara Masuk'
                },
                content: {
                    en: [
                        { type: 'text', text: 'Login to access your saved products, orders, and seller features.' },
                        { type: 'step', text: 'Tap the "Masuk" or "Sign In" button' },
                        { type: 'step', text: 'Enter your email and password' },
                        { type: 'step', text: 'Tap "Masuk" to sign in' },
                        { type: 'tip', text: 'Enable "Ingat Saya" to stay logged in on your device.' }
                    ],
                    id: [
                        { type: 'text', text: 'Masuk untuk mengakses produk tersimpan, pesanan, dan fitur penjual.' },
                        { type: 'step', text: 'Ketuk tombol "Masuk" atau "Sign In"' },
                        { type: 'step', text: 'Masukkan email dan kata sandi Anda' },
                        { type: 'step', text: 'Ketuk "Masuk" untuk masuk' },
                        { type: 'tip', text: 'Aktifkan "Ingat Saya" untuk tetap masuk di perangkat Anda.' }
                    ]
                }
            }
        ]
    },
    {
        id: 'shopping',
        icon: 'cart',
        title: {
            en: 'Shopping Guide',
            id: 'Panduan Belanja'
        },
        description: {
            en: 'Learn how to find and purchase products',
            id: 'Pelajari cara menemukan dan membeli produk'
        },
        articles: [
            {
                id: 'browse-products',
                title: {
                    en: 'How to Browse Products',
                    id: 'Cara Menjelajahi Produk'
                },
                content: {
                    en: [
                        { type: 'text', text: 'Find products from local MSMEs near you:' },
                        { type: 'step', text: 'Go to the "Produk" or Products tab' },
                        { type: 'step', text: 'Scroll through featured products or use the search bar' },
                        { type: 'step', text: 'Use filters to narrow down by category, price, or rating' },
                        { type: 'step', text: 'Tap any product to view details' },
                        { type: 'tip', text: 'Check the "Terdekat" tab to see products from sellers near your location.' }
                    ],
                    id: [
                        { type: 'text', text: 'Temukan produk dari UMKM lokal di sekitar Anda:' },
                        { type: 'step', text: 'Buka tab "Produk" atau Products' },
                        { type: 'step', text: 'Gulir melalui produk andal atau gunakan bilah pencarian' },
                        { type: 'step', text: 'Gunakan filter untuk mempersempit berdasarkan kategori, harga, atau rating' },
                        { type: 'step', text: 'Ketuk produk apa pun untuk melihat detail' },
                        { type: 'tip', text: 'Periksa tab "Terdekat" untuk melihat produk dari penjual dekat lokasi Anda.' }
                    ]
                }
            },
            {
                id: 'add-to-cart',
                title: {
                    en: 'How to Add Products to Cart',
                    id: 'Cara Menambahkan Produk ke Keranjang'
                },
                content: {
                    en: [
                        { type: 'text', text: 'Add products to your cart to purchase them later:' },
                        { type: 'step', text: 'Browse or search for the product you want' },
                        { type: 'step', text: 'Tap on the product to open its details page' },
                        { type: 'step', text: 'Select quantity and any variants (size, color, etc.)' },
                        { type: 'step', text: 'Tap "Tambah ke Keranjang" or "Add to Cart"' },
                        { type: 'step', text: 'Continue shopping or go to cart to checkout' },
                        { type: 'tip', text: 'You can add products from multiple sellers, but each seller will have a separate cart.' }
                    ],
                    id: [
                        { type: 'text', text: 'Tambahkan produk ke keranjang untuk dibeli nanti:' },
                        { type: 'step', text: 'Jelajahi atau cari produk yang Anda inginkan' },
                        { type: 'step', text: 'Ketuk produk untuk membuka halaman detail' },
                        { type: 'step', text: 'Pilih jumlah dan varian apa pun (ukuran, warna, dll.)' },
                        { type: 'step', text: 'Ketuk "Tambah ke Keranjang" atau "Add to Cart"' },
                        { type: 'step', text: 'Lanjutkan belanja atau pergi ke keranjang untuk checkout' },
                        { type: 'tip', text: 'Anda dapat menambahkan produk dari beberapa penjual, tetapi setiap penjual akan memiliki keranjang terpisah.' }
                    ]
                }
            },
            {
                id: 'checkout',
                title: {
                    en: 'How to Checkout',
                    id: 'Cara Checkout'
                },
                content: {
                    en: [
                        { type: 'text', text: 'Complete your purchase by following these steps:' },
                        { type: 'step', text: 'Go to your cart by tapping the cart icon' },
                        { type: 'step', text: 'Review your items and quantities' },
                        { type: 'step', text: 'Choose delivery method (delivery or pickup)' },
                        { type: 'step', text: 'If delivery, select or enter your delivery address on the map' },
                        { type: 'step', text: 'Choose payment method' },
                        { type: 'step', text: 'Tap "Buat Pesanan" or "Place Order" to complete' },
                        { type: 'tip', text: 'For pickup, note the store address and visit during operating hours.' }
                    ],
                    id: [
                        { type: 'text', text: 'Selesaikan pembelian Anda dengan mengikuti langkah-langkah berikut:' },
                        { type: 'step', text: 'Buka keranjang dengan mengetuk ikon keranjang' },
                        { type: 'step', text: 'Periksa item dan jumlah Anda' },
                        { type: 'step', text: 'Pilih metode pengiriman (pengantaran atau pengambilan)' },
                        { type: 'step', text: 'Jika pengiriman, pilih atau masukkan alamat pengiriman Anda di peta' },
                        { type: 'step', text: 'Pilih metode pembayaran' },
                        { type: 'step', text: 'Ketuk "Buat Pesanan" atau "Place Order" untuk menyelesaikan' },
                        { type: 'tip', text: 'Untuk pengambilan, catat alamat toko dan kunjungan selama jam operasional.' }
                    ]
                }
            },
            {
                id: 'track-order',
                title: {
                    en: 'How to Track Your Order',
                    id: 'Cara Melacak Pesanan Anda'
                },
                content: {
                    en: [
                        { type: 'text', text: 'Monitor your order status from placement to delivery:' },
                        { type: 'step', text: 'Go to "Pesanan Saya" or My Orders' },
                        { type: 'step', text: 'Find the order you want to track' },
                        { type: 'step', text: 'Tap on the order to see details' },
                        { type: 'step', text: 'For delivery orders, tap "Lacak" to see driver location' },
                        { type: 'step', text: 'Order statuses: Menunggu (Pending) → Dikonfirmasi (Confirmed) → Sedang Disiapkan (Preparing) → Dalam Perjalanan (Out for Delivery) → Terkirim (Delivered)' },
                        { type: 'tip', text: 'Enable notifications to receive updates on your order status.' }
                    ],
                    id: [
                        { type: 'text', text: 'Pantau status pesanan Anda dari penempatan hingga pengiriman:' },
                        { type: 'step', text: 'Buka "Pesanan Saya" atau My Orders' },
                        { type: 'step', text: 'Temukan pesanan yang ingin Anda lacak' },
                        { type: 'step', text: 'Ketuk pesanan untuk melihat detail' },
                        { type: 'step', text: 'Untuk pesanan pengantaran, ketuk "Lacak" untuk melihat lokasi driver' },
                        { type: 'step', text: 'Status pesanan: Menunggu → Dikonfirmasi → Sedang Disiapkan → Dalam Perjalanan → Terkirim' },
                        { type: 'tip', text: 'Aktifkan notifikasi untuk menerima pembaruan status pesanan Anda.' }
                    ]
                }
            }
        ]
    },
    {
        id: 'selling',
        icon: 'storefront',
        title: {
            en: 'Seller Guide',
            id: 'Panduan Penjual'
        },
        description: {
            en: 'Learn how to sell products on the platform',
            id: 'Pelajari cara menjual produk di platform'
        },
        articles: [
            {
                id: 'register-seller',
                title: {
                    en: 'How to Register as a Seller',
                    id: 'Cara Mendaftar sebagai Penjual'
                },
                content: {
                    en: [
                        { type: 'text', text: 'Start selling on MSME Marketplace by registering your business:' },
                        { type: 'step', text: 'Login to your account' },
                        { type: 'step', text: 'Go to Profile and tap "Menjadi Penjual" or "Register as Seller"' },
                        { type: 'step', text: 'Enter your business details (name, type, address)' },
                        { type: 'step', text: 'Set your business location on the map' },
                        { type: 'step', text: 'Submit for verification' },
                        { type: 'step', text: 'Once approved, you can start adding products' },
                        { type: 'tip', text: 'Verified sellers get a blue checkmark and appear higher in search results.' }
                    ],
                    id: [
                        { type: 'text', text: 'Mulai berjualan di MSME Marketplace dengan mendaftarkan bisnis Anda:' },
                        { type: 'step', text: 'Masuk ke akun Anda' },
                        { type: 'step', text: 'Buka Profil dan ketuk "Menjadi Penjual" atau "Register as Seller"' },
                        { type: 'step', text: 'Masukkan detail bisnis Anda (nama, jenis, alamat)' },
                        { type: 'step', text: 'Atur lokasi bisnis Anda di peta' },
                        { type: 'step', text: 'Kirim untuk verifikasi' },
                        { type: 'step', text: 'Setelah disetujui, Anda dapat mulai menambahkan produk' },
                        { type: 'tip', text: 'Penjual terverifikasi mendapatkan centang biru dan muncul lebih tinggi di hasil pencarian.' }
                    ]
                }
            },
            {
                id: 'add-product',
                title: {
                    en: 'How to Add Products',
                    id: 'Cara Menambahkan Produk'
                },
                content: {
                    en: [
                        { type: 'text', text: 'List your products to start selling:' },
                        { type: 'step', text: 'Go to "Dasbor Penjual" or Seller Dashboard' },
                        { type: 'step', text: 'Tap "Tambah Produk" or "Add Product"' },
                        { type: 'step', text: 'Enter product name and description' },
                        { type: 'step', text: 'Set price and stock quantity' },
                        { type: 'step', text: 'Select category' },
                        { type: 'step', text: 'Add product images (up to 5 images recommended)' },
                        { type: 'step', text: 'Set product location' },
                        { type: 'step', text: 'Tap "Tambah Produk" to publish' },
                        { type: 'tip', text: 'Use high-quality images and detailed descriptions to attract more buyers.' }
                    ],
                    id: [
                        { type: 'text', text: 'Daftarkan produk Anda untuk mulai menjual:' },
                        { type: 'step', text: 'Buka "Dasbor Penjual" atau Seller Dashboard' },
                        { type: 'step', text: 'Ketuk "Tambah Produk" atau "Add Product"' },
                        { type: 'step', text: 'Masukkan nama dan deskripsi produk' },
                        { type: 'step', text: 'Atur harga dan jumlah stok' },
                        { type: 'step', text: 'Pilih kategori' },
                        { type: 'step', text: 'Tambahkan gambar produk (disarankan hingga 5 gambar)' },
                        { type: 'step', text: 'Atur lokasi produk' },
                        { type: 'step', text: 'Ketuk "Tambah Produk" untuk mempublikasikan' },
                        { type: 'tip', text: 'Gunakan gambar berkualitas tinggi dan deskripsi detail untuk menarik lebih banyak pembeli.' }
                    ]
                }
            },
            {
                id: 'manage-orders',
                title: {
                    en: 'How to Manage Orders',
                    id: 'Cara Mengelola Pesanan'
                },
                content: {
                    en: [
                        { type: 'text', text: 'Handle incoming orders efficiently:' },
                        { type: 'step', text: 'Go to "Pesanan" or Orders in your seller dashboard' },
                        { type: 'step', text: 'View all orders sorted by status' },
                        { type: 'step', text: 'For new orders: Tap to view details and confirm' },
                        { type: 'step', text: 'Update order status: Preparing → Ready → Out for Delivery' },
                        { type: 'step', text: 'Chat with buyers directly if needed' },
                        { type: 'step', text: 'Handle cancellations or issues promptly' },
                        { type: 'tip', text: 'Respond to orders quickly to maintain good seller rating.' }
                    ],
                    id: [
                        { type: 'text', text: 'Tangani pesanan masuk secara efisien:' },
                        { type: 'step', text: 'Buka "Pesanan" atau Orders di dasbor penjual Anda' },
                        { type: 'step', text: 'Lihat semua pesanan yang diurutkan berdasarkan status' },
                        { type: 'step', text: 'Untuk pesanan baru: Ketuk untuk melihat detail dan konfirmasi' },
                        { type: 'step', text: 'Perbarui status pesanan: Menyiapkan → Siap → Dalam Perjalanan' },
                        { type: 'step', text: 'Ngobrol dengan pembeli langsung jika diperlukan' },
                        { type: 'step', text: 'Tangani pembatalan atau masalah dengan segera' },
                        { type: 'tip', text: 'Respons cepat terhadap pesanan untuk mempertahankan rating penjual yang baik.' }
                    ]
                }
            }
        ]
    },
    {
        id: 'map-location',
        icon: 'map',
        title: {
            en: 'Map & Location',
            id: 'Peta & Lokasi'
        },
        description: {
            en: 'Learn how to use maps and location features',
            id: 'Pelajari cara menggunakan fitur peta dan lokasi'
        },
        articles: [
            {
                id: 'find-nearby',
                title: {
                    en: 'How to Find Nearby Sellers',
                    id: 'Cara Menemukan Penjual Terdekat'
                },
                content: {
                    en: [
                        { type: 'text', text: 'Discover sellers in your area:' },
                        { type: 'step', text: 'Tap "Terdekat" or "Nearby" in the bottom navigation' },
                        { type: 'step', text: 'Allow location access when prompted' },
                        { type: 'step', text: 'The map will show sellers near your location' },
                        { type: 'step', text: 'Use the search bar to find specific sellers' },
                        { type: 'step', text: 'Adjust the search radius using the slider' },
                        { type: 'step', text: 'Tap on any seller marker to view their store' },
                        { type: 'tip', text: 'Enable precise location for more accurate results.' }
                    ],
                    id: [
                        { type: 'text', text: 'Temukan penjual di area Anda:' },
                        { type: 'step', text: 'Ketuk "Terdekat" atau "Nearby" di navigasi bawah' },
                        { type: 'step', text: 'Izinkan akses lokasi saat diminta' },
                        { type: 'step', text: 'Peta akan menampilkan penjual dekat lokasi Anda' },
                        { type: 'step', text: 'Gunakan bilah pencarian untuk menemukan penjual tertentu' },
                        { type: 'step', text: 'Sesuaikan radius pencarian menggunakan penggeser' },
                        { type: 'step', text: 'Ketuk penanda penjual mana pun untuk melihat toko mereka' },
                        { type: 'tip', text: 'Aktifkan lokasi tepat untuk hasil yang lebih akurat.' }
                    ]
                }
            },
            {
                id: 'set-location',
                title: {
                    en: 'How to Set Your Location',
                    id: 'Cara Mengatur Lokasi Anda'
                },
                content: {
                    en: [
                        { type: 'text', text: 'Set your location for better shopping experience:' },
                        { type: 'step', text: 'Go to Profile → Settings' },
                        { type: 'step', text: 'Tap "Atur Lokasi" or "Set Location"' },
                        { type: 'step', text: 'Search for your address or use current location' },
                        { type: 'step', text: 'Tap on the map to pin your exact location' },
                        { type: 'step', text: 'Confirm your location' },
                        { type: 'tip', text: 'Your location helps us show nearby sellers and calculate delivery.' }
                    ],
                    id: [
                        { type: 'text', text: 'Atur lokasi Anda untuk pengalaman belanja yang lebih baik:' },
                        { type: 'step', text: 'Buka Profil → Pengaturan' },
                        { type: 'step', text: 'Ketuk "Atur Lokasi" atau "Set Location"' },
                        { type: 'step', text: 'Cari alamat Anda atau gunakan lokasi saat ini' },
                        { type: 'step', text: 'Ketuk di peta untuk pin lokasi tepat Anda' },
                        { type: 'step', text: 'Konfirmasi lokasi Anda' },
                        { type: 'tip', text: 'Lokasi Anda membantu kami menampilkan penjual terdekat dan menghitung pengiriman.' }
                    ]
                }
            },
            {
                id: 'delivery-tracking',
                title: {
                    en: 'Live Delivery Tracking',
                    id: 'Pelacakan Pengiriman Langsung'
                },
                content: {
                    en: [
                        { type: 'text', text: 'Track your delivery in real-time:' },
                        { type: 'step', text: 'Go to "Pesanan Saya" and find your active order' },
                        { type: 'step', text: 'Tap "Lacak" or "Track Order"' },
                        { type: 'step', text: "View the driver's location on the map" },
                        { type: 'step', text: 'See estimated arrival time' },
                        { type: 'step', text: 'Contact driver directly if needed' },
                        { type: 'tip', text: "You'll receive notifications when the driver is nearby." }
                    ],
                    id: [
                        { type: 'text', text: 'Lacak pengiriman Anda secara real-time:' },
                        { type: 'step', text: 'Buka "Pesanan Saya" dan temukan pesanan aktif Anda' },
                        { type: 'step', text: 'Ketuk "Lacak" atau "Track Order"' },
                        { type: 'step', text: 'Lihat lokasi driver di peta' },
                        { type: 'step', text: 'Lihat perkiraan waktu tiba' },
                        { type: 'step', text: 'Hubungi driver langsung jika diperlukan' },
                        { type: 'tip', text: 'Anda akan menerima notifikasi saat driver dekat.' }
                    ]
                }
            }
        ]
    },
    {
        id: 'account',
        icon: 'person',
        title: {
            en: 'Account & Settings',
            id: 'Akun & Pengaturan'
        },
        description: {
            en: 'Manage your account and preferences',
            id: 'Kelola akun dan preferensi Anda'
        },
        articles: [
            {
                id: 'edit-profile',
                title: {
                    en: 'How to Edit Your Profile',
                    id: 'Cara Mengedit Profil Anda'
                },
                content: {
                    en: [
                        { type: 'text', text: 'Update your profile information:' },
                        { type: 'step', text: 'Go to Profile tab' },
                        { type: 'step', text: 'Tap "Edit Profil" or "Edit Profile"' },
                        { type: 'step', text: 'Update your name, phone, or address' },
                        { type: 'step', text: 'Change your profile picture' },
                        { type: 'step', text: 'Save changes' },
                        { type: 'tip', text: 'Keep your profile updated for better communication with sellers.' }
                    ],
                    id: [
                        { type: 'text', text: 'Perbarui informasi profil Anda:' },
                        { type: 'step', text: 'Buka tab Profil' },
                        { type: 'step', text: 'Ketuk "Edit Profil" atau "Edit Profile"' },
                        { type: 'step', text: 'Perbarui nama, telepon, atau alamat Anda' },
                        { type: 'step', text: 'Ubah foto profil Anda' },
                        { type: 'step', text: 'Simpan perubahan' },
                        { type: 'tip', text: 'Jaga profil Anda tetap terkini untuk komunikasi yang lebih baik dengan penjual.' }
                    ]
                }
            },
            {
                id: 'dark-mode',
                title: {
                    en: 'How to Enable Dark Mode',
                    id: 'Cara Mengaktifkan Mode Gelap'
                },
                content: {
                    en: [
                        { type: 'text', text: 'Switch between light and dark themes:' },
                        { type: 'step', text: 'Go to Profile → Settings' },
                        { type: 'step', text: 'Find "Mode Gelap" or "Dark Mode" option' },
                        { type: 'step', text: 'Toggle the switch to enable/disable' },
                        { type: 'tip', text: 'Dark mode is easier on the eyes at night and saves battery on OLED screens.' }
                    ],
                    id: [
                        { type: 'text', text: 'Beralih antara tema terang dan gelap:' },
                        { type: 'step', text: 'Buka Profil → Pengaturan' },
                        { type: 'step', text: 'Temukan opsi "Mode Gelap" atau "Dark Mode"' },
                        { type: 'step', text: 'Alihkan sakelar untuk mengaktifkan/menonaktifkan' },
                        { type: 'tip', text: 'Mode gelap lebih nyaman di mata di malam hari dan menghemat baterai di layar OLED.' }
                    ]
                }
            },
            {
                id: 'language',
                title: {
                    en: 'How to Change Language',
                    id: 'Cara Mengubah Bahasa'
                },
                content: {
                    en: [
                        { type: 'text', text: 'Switch between English and Indonesian:' },
                        { type: 'step', text: 'Go to Profile → Settings' },
                        { type: 'step', text: 'Find "Bahasa" or "Language" option' },
                        { type: 'step', text: 'Select "English" or "Bahasa Indonesia"' },
                        { type: 'tip', text: 'The app interface will update to the selected language.' }
                    ],
                    id: [
                        { type: 'text', text: 'Beralih antara Inggris dan Indonesia:' },
                        { type: 'step', text: 'Buka Profil → Pengaturan' },
                        { type: 'step', text: 'Temukan opsi "Bahasa" atau "Language"' },
                        { type: 'step', text: 'Pilih "English" atau "Bahasa Indonesia"' },
                        { type: 'tip', text: 'Antarmuka aplikasi akan diperbarui ke bahasa yang dipilih.' }
                    ]
                }
            }
        ]
    },
    {
        id: 'features',
        icon: 'star',
        title: {
            en: 'App Features',
            id: 'Fitur Aplikasi'
        },
        description: {
            en: 'Learn about special features',
            id: 'Pelajari fitur-fitur khusus'
        },
        articles: [
            {
                id: 'saved-products',
                title: {
                    en: 'How to Save Products',
                    id: 'Cara Menyimpan Produk'
                },
                content: {
                    en: [
                        { type: 'text', text: 'Save products to buy later:' },
                        { type: 'step', text: 'Open any product detail page' },
                        { type: 'step', text: 'Tap the heart icon or "Simpan" button' },
                        { type: 'step', text: 'View saved products in Profile → Tersimpan' },
                        { type: 'tip', text: 'You can also save products from the seller\'s store page.' }
                    ],
                    id: [
                        { type: 'text', text: 'Simpan produk untuk dibeli nanti:' },
                        { type: 'step', text: 'Buka halaman detail produk apa pun' },
                        { type: 'step', text: 'Ketuk ikon hati atau tombol "Simpan"' },
                        { type: 'step', text: 'Lihat produk tersimpan di Profil → Tersimpan' },
                        { type: 'tip', text: 'Anda juga dapat menyimpan produk dari halaman toko penjual.' }
                    ]
                }
            },
            {
                id: 'chat-seller',
                title: {
                    en: 'How to Chat with Sellers',
                    id: 'Cara Mengobrol dengan Penjual'
                },
                content: {
                    en: [
                        { type: 'text', text: 'Communicate directly with sellers:' },
                        { type: 'step', text: 'Open any product or seller store' },
                        { type: 'step', text: 'Tap "Chat" or "Hubungi Penjual"' },
                        { type: 'step', text: 'Type your message and send' },
                        { type: 'step', text: 'View conversations in "Pesan" or Messages' },
                        { type: 'tip', text: 'Ask about product details, negotiate prices, or inquire about availability.' }
                    ],
                    id: [
                        { type: 'text', text: 'Komunikasikan langsung dengan penjual:' },
                        { type: 'step', text: 'Buka produk atau toko penjual mana pun' },
                        { type: 'step', text: 'Ketuk "Chat" atau "Hubungi Penjual"' },
                        { type: 'step', text: 'Ketik pesan Anda dan kirim' },
                        { type: 'step', text: 'Lihat percakapan di "Pesan" atau Messages' },
                        { type: 'tip', text: 'Tanyakan detail produk, tawar harga, atau inquire tentang ketersediaan.' }
                    ]
                }
            },
            {
                id: 'forums',
                title: {
                    en: 'Community Forums',
                    id: 'Forum Komunitas'
                },
                content: {
                    en: [
                        { type: 'text', text: 'Join discussions with other users:' },
                        { type: 'step', text: 'Go to "Forum" tab' },
                        { type: 'step', text: 'Browse topics or search for discussions' },
                        { type: 'step', text: 'Tap "Buat Thread" to start a new discussion' },
                        { type: 'step', text: 'Reply to existing threads' },
                        { type: 'tip', text: 'Share tips, ask questions, and connect with fellow MSMEs.' }
                    ],
                    id: [
                        { type: 'text', text: 'Bergabung dalam diskusi dengan pengguna lain:' },
                        { type: 'step', text: 'Buka tab "Forum"' },
                        { type: 'step', text: 'Jelajahi topik atau cari diskusi' },
                        { type: 'step', text: 'Ketuk "Buat Thread" untuk memulai diskusi baru' },
                        { type: 'step', text: 'Balas thread yang ada' },
                        { type: 'tip', text: 'Bagikan tips, bertanya, dan terhubung dengan sesama UMKM.' }
                    ]
                }
            },
            {
                id: 'logo-generator',
                title: {
                    en: 'AI Logo Generator',
                    id: 'Generator Logo AI'
                },
                content: {
                    en: [
                        { type: 'text', text: 'Create a professional logo for your business:' },
                        { type: 'step', text: 'Go to Seller Dashboard' },
                        { type: 'step', text: 'Tap "Generator Logo" or "Pembuat Logo"' },
                        { type: 'step', text: 'Describe your logo idea in the text field' },
                        { type: 'step', text: 'Tap "Buat Logo" to generate' },
                        { type: 'step', text: 'Select your favorite design' },
                        { type: 'step', text: 'Tap "Gunakan" to set as your business logo' },
                        { type: 'tip', text: 'Premium members get unlimited logo generations.' }
                    ],
                    id: [
                        { type: 'text', text: 'Buat logo profesional untuk bisnis Anda:' },
                        { type: 'step', text: 'Buka Dasbor Penjual' },
                        { type: 'step', text: 'Ketuk "Generator Logo" atau "Pembuat Logo"' },
                        { type: 'step', text: 'Jelaskan ide logo Anda di bidang teks' },
                        { type: 'step', text: 'Ketuk "Buat Logo" untuk membuat' },
                        { type: 'step', text: 'Pilih desain favorit Anda' },
                        { type: 'step', text: 'Ketuk "Gunakan" untuk mengatur sebagai logo bisnis Anda' },
                        { type: 'tip', text: 'Anggota premium mendapatkan pembuatan logo tanpa batas.' }
                    ]
                }
            }
        ]
    }
];
