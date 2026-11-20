/* ========================================================
   FOODIEHUB - FRONTEND DEMO DATA (FOR GITHUB PAGES)
   Self-contained demo data - No backend or database required
======================================================== */

const INITIAL_RESTAURANTS = [
    {
        restaurant_id: 1,
        name: 'Madras Tiffin House',
        cuisine: 'South Indian',
        address: '14 Gandhipuram, 5th Cross, Coimbatore',
        rating: 4.8,
        image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
    },
    {
        restaurant_id: 2,
        name: 'Spice Symphony Kitchen',
        cuisine: 'North Indian',
        address: '88 Residency Road, Bangalore',
        rating: 4.7,
        image_url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80'
    },
    {
        restaurant_id: 3,
        name: 'Dragon Wok Express',
        cuisine: 'Chinese',
        address: '23 Park Street, Kolkata',
        rating: 4.6,
        image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
    },
    {
        restaurant_id: 4,
        name: 'Pizzeria Bella Italia',
        cuisine: 'Pizza & Italian',
        address: '45 MG Road, Koramangala, Bangalore',
        rating: 4.9,
        image_url: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=800&q=80'
    },
    {
        restaurant_id: 5,
        name: 'The Burger & Grill Shack',
        cuisine: 'Fast Food',
        address: '12 Brigade Road, Bangalore',
        rating: 4.6,
        image_url: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80'
    },
    {
        restaurant_id: 6,
        name: 'Sweet Delights Patisserie',
        cuisine: 'Desserts & Bakery',
        address: '99 Indiranagar 100ft Road, Bangalore',
        rating: 4.8,
        image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'
    }
];

const INITIAL_FOODS = [
    // South Indian
    {
        food_id: 1,
        restaurant_id: 1,
        restaurant_name: 'Madras Tiffin House',
        restaurant_cuisine: 'South Indian',
        restaurant_rating: 4.8,
        name: 'Crispy Ghee Podi Masala Dosa',
        category: 'South Indian',
        description: 'Golden fermented rice-lentil crepe slathered with pure desi ghee, gun powder, and stuffed with spiced potato masala. Served with 3 coconut chutneys and hot sambar.',
        price: 140.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80'
    },
    {
        food_id: 2,
        restaurant_id: 1,
        restaurant_name: 'Madras Tiffin House',
        restaurant_cuisine: 'South Indian',
        restaurant_rating: 4.8,
        name: 'Steamed Idli & Medu Vada Combo',
        category: 'South Indian',
        description: 'Two fluffy steamed rice cakes paired with two crispy golden lentil fritters, served piping hot with freshly grated coconut chutney and aromatic drumstick sambar.',
        price: 110.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80'
    },
    {
        food_id: 3,
        restaurant_id: 1,
        restaurant_name: 'Madras Tiffin House',
        restaurant_cuisine: 'South Indian',
        restaurant_rating: 4.8,
        name: 'Chettinad Chicken Biryani',
        category: 'South Indian',
        description: 'Traditional seeraga samba rice cooked with tender chicken pieces, stone-ground Chettinad spices, fresh mint, and star anise. Served with onion raita.',
        price: 280.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80'
    },
    {
        food_id: 4,
        restaurant_id: 1,
        restaurant_name: 'Madras Tiffin House',
        restaurant_cuisine: 'South Indian',
        restaurant_rating: 4.8,
        name: 'Mysore Masala Dosa',
        category: 'South Indian',
        description: 'Signature crispy Mysore dosa smeared with spicy red garlic-chutney paste and loaded with rich potato bhaji and fresh coriander.',
        price: 160.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?auto=format&fit=crop&w=800&q=80'
    },

    // North Indian
    {
        food_id: 5,
        restaurant_id: 2,
        restaurant_name: 'Spice Symphony Kitchen',
        restaurant_cuisine: 'North Indian',
        restaurant_rating: 4.7,
        name: 'Paneer Butter Masala',
        category: 'North Indian',
        description: 'Fresh melt-in-mouth cottage cheese cubes simmered in a rich, buttery, velvety tomato-cashew gravy scented with dried fenugreek leaves.',
        price: 260.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80'
    },
    {
        food_id: 6,
        restaurant_id: 2,
        restaurant_name: 'Spice Symphony Kitchen',
        restaurant_cuisine: 'North Indian',
        restaurant_rating: 4.7,
        name: 'Tandoori Butter Naan Basket',
        category: 'North Indian',
        description: 'Assortment of freshly baked leavened clay-oven flatbreads brushed generously with garlic butter and fresh cilantro.',
        price: 90.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80'
    },
    {
        food_id: 7,
        restaurant_id: 2,
        restaurant_name: 'Spice Symphony Kitchen',
        restaurant_cuisine: 'North Indian',
        restaurant_rating: 4.7,
        name: 'Slow-Cooked Dal Makhani',
        category: 'North Indian',
        description: 'Whole black lentils and kidney beans simmered overnight with butter, cream, and slow-roasted whole spices for that legendary smoky aroma.',
        price: 220.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80'
    },
    {
        food_id: 8,
        restaurant_id: 2,
        restaurant_name: 'Spice Symphony Kitchen',
        restaurant_cuisine: 'North Indian',
        restaurant_rating: 4.7,
        name: 'Murgh Makhani (Butter Chicken)',
        category: 'North Indian',
        description: 'Smoked tandoori chicken cooked in a rich satin-smooth tomato makhani gravy with homemade white butter and fresh cream.',
        price: 320.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80'
    },

    // Chinese
    {
        food_id: 9,
        restaurant_id: 3,
        restaurant_name: 'Dragon Wok Express',
        restaurant_cuisine: 'Chinese',
        restaurant_rating: 4.6,
        name: 'Wok-Tossed Hakka Veg Noodles',
        category: 'Chinese',
        description: 'Traditional thin wheat noodles stir-fried in a fiery wok with crunchy julienned bell peppers, cabbage, scallions, and signature dark soy sauce.',
        price: 180.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80'
    },
    {
        food_id: 10,
        restaurant_id: 3,
        restaurant_name: 'Dragon Wok Express',
        restaurant_cuisine: 'Chinese',
        restaurant_rating: 4.6,
        name: 'Crispy Chilli Chicken Dry',
        category: 'Chinese',
        description: 'Crisp-fried boneless chicken cubes wok-tossed with fresh green chillies, garlic flakes, ginger, and pungent spring onion greens.',
        price: 250.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=80'
    },
    {
        food_id: 11,
        restaurant_id: 3,
        restaurant_name: 'Dragon Wok Express',
        restaurant_cuisine: 'Chinese',
        restaurant_rating: 4.6,
        name: 'Schezwan Egg Fried Rice',
        category: 'Chinese',
        description: 'Fragrant long-grain basmati tossed with scrambled eggs, diced vegetables, and spicy Sichuan peppercorn red chilli paste.',
        price: 210.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80'
    },
    {
        food_id: 12,
        restaurant_id: 3,
        restaurant_name: 'Dragon Wok Express',
        restaurant_cuisine: 'Chinese',
        restaurant_rating: 4.6,
        name: 'Steamed Chicken Dim Sums (6 Pcs)',
        category: 'Chinese',
        description: 'Delicate translucent dumplings filled with minced spiced chicken and scallions, served with fiery garlic-chilli dip.',
        price: 220.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80'
    },

    // Fast Food
    {
        food_id: 13,
        restaurant_id: 5,
        restaurant_name: 'The Burger & Grill Shack',
        restaurant_cuisine: 'Fast Food',
        restaurant_rating: 4.6,
        name: 'Ultimate Double Cheese Crunch Burger',
        category: 'Fast Food',
        description: 'Two thick crispy spiced patties layered with double cheddar slices, crisp iceberg lettuce, caramelized onions, and secret smoked burger mayo.',
        price: 230.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'
    },
    {
        food_id: 14,
        restaurant_id: 5,
        restaurant_name: 'The Burger & Grill Shack',
        restaurant_cuisine: 'Fast Food',
        restaurant_rating: 4.6,
        name: 'Loaded Peri-Peri Crinkle Fries',
        category: 'Fast Food',
        description: 'Golden crispy potato crinkle fries dusted with zesty African bird’s eye peri-peri seasoning and drizzled with warm melted cheese dip.',
        price: 130.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80'
    },
    {
        food_id: 15,
        restaurant_id: 5,
        restaurant_name: 'The Burger & Grill Shack',
        restaurant_cuisine: 'Fast Food',
        restaurant_rating: 4.6,
        name: 'Grilled Triple-Decker Club Sandwich',
        category: 'Fast Food',
        description: 'Toasted multi-grain bread packed with fresh cucumber, tomatoes, cheese slices, crispy corn and spiced mint coleslaw. Served with potato wafers.',
        price: 170.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80'
    },
    {
        food_id: 16,
        restaurant_id: 5,
        restaurant_name: 'The Burger & Grill Shack',
        restaurant_cuisine: 'Fast Food',
        restaurant_rating: 4.6,
        name: 'Smoky BBQ Chicken Wings (6 Pcs)',
        category: 'Fast Food',
        description: 'Juicy succulent chicken wings batter-fried and drenched in thick, hickory-wood smoked barbecue glaze with toasted sesame seeds.',
        price: 260.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80'
    },

    // Pizza
    {
        food_id: 17,
        restaurant_id: 4,
        restaurant_name: 'Pizzeria Bella Italia',
        restaurant_cuisine: 'Pizza & Italian',
        restaurant_rating: 4.9,
        name: 'Classic Margherita Wood-Fired Pizza',
        category: 'Pizza',
        description: 'Handcrafted sourdough base topped with San Marzano tomato sauce, fresh buffalo mozzarella, fragrant basil leaves, and extra-virgin olive oil.',
        price: 340.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80'
    },
    {
        food_id: 18,
        restaurant_id: 4,
        restaurant_name: 'Pizzeria Bella Italia',
        restaurant_cuisine: 'Pizza & Italian',
        restaurant_rating: 4.9,
        name: 'Farmhouse Garden Supreme Pizza',
        category: 'Pizza',
        description: 'Loaded with crunchy bell peppers, button mushrooms, ripe red onions, black Kalamata olives, juicy sweet corn, and 100% real mozzarella.',
        price: 390.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80'
    },
    {
        food_id: 19,
        restaurant_id: 4,
        restaurant_name: 'Pizzeria Bella Italia',
        restaurant_cuisine: 'Pizza & Italian',
        restaurant_rating: 4.9,
        name: 'Spicy Barbecue Chicken Pizza',
        category: 'Pizza',
        description: 'Tender shredded chicken chunks tossed in spicy sweet barbecue glaze, red onions, jalapenos, and melted smoked gouda and mozzarella.',
        price: 440.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80'
    },
    {
        food_id: 20,
        restaurant_id: 4,
        restaurant_name: 'Pizzeria Bella Italia',
        restaurant_cuisine: 'Pizza & Italian',
        restaurant_rating: 4.9,
        name: 'Tandoori Paneer Tikka Feast Pizza',
        category: 'Pizza',
        description: 'Indian fusion masterpiece featuring marinated chargrilled paneer cubes, capsicum, red paprika, and creamy tandoori mayo swirl on crispy crust.',
        price: 410.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80'
    },

    // Desserts
    {
        food_id: 21,
        restaurant_id: 6,
        restaurant_name: 'Sweet Delights Patisserie',
        restaurant_cuisine: 'Desserts & Bakery',
        restaurant_rating: 4.8,
        name: 'Belgian Molten Choco Lava Cake',
        category: 'Desserts',
        description: 'Decadent warm dark chocolate sponge filled with a river of silky molten Belgian ganache. Served with Madagascar vanilla bean ice cream.',
        price: 160.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80'
    },
    {
        food_id: 22,
        restaurant_id: 6,
        restaurant_name: 'Sweet Delights Patisserie',
        restaurant_cuisine: 'Desserts & Bakery',
        restaurant_rating: 4.8,
        name: 'Royal Shahi Gulab Jamun (2 Pcs)',
        category: 'Desserts',
        description: 'Warm soft khoya dumplings infused with green cardamom, soaked in saffron-infused rose sugar syrup and garnished with sliced pistachios.',
        price: 110.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80'
    },
    {
        food_id: 23,
        restaurant_id: 6,
        restaurant_name: 'Sweet Delights Patisserie',
        restaurant_cuisine: 'Desserts & Bakery',
        restaurant_rating: 4.8,
        name: 'Kesar Pista Rasmalai Trio',
        category: 'Desserts',
        description: 'Tender cottage cheese discs soaked in sweetened, thickened saffron cardamom milk, topped with slivered almonds and fragrant silver vark.',
        price: 150.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80'
    },
    {
        food_id: 24,
        restaurant_id: 6,
        restaurant_name: 'Sweet Delights Patisserie',
        restaurant_cuisine: 'Desserts & Bakery',
        restaurant_rating: 4.8,
        name: 'New York Baked Berry Cheesecake',
        category: 'Desserts',
        description: 'Velvety smooth cream cheese baked over a crunchy graham cracker crust, crowned with a vibrant homemade wild berry compote.',
        price: 220.00,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80'
    }
];

const INITIAL_CUSTOMERS = [
    {
        customer_id: 1,
        name: 'Rahul Sharma',
        email: 'rahul.sharma@gmail.com',
        phone: '9876543210',
        address: 'Flat 402, Sunshine Heights, 3rd Cross',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560103',
        password: 'Password@123',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    }
];

const INITIAL_ORDERS = [
    {
        order_id: 1001,
        customer_id: 1,
        customer_name: 'Rahul Sharma',
        delivery_phone: '9876543210',
        delivery_address: 'Flat 402, Sunshine Heights, 3rd Cross',
        delivery_city: 'Bangalore',
        delivery_state: 'Karnataka',
        delivery_pincode: '560103',
        special_instructions: 'Ring the doorbell twice please',
        payment_method: 'Cash on Delivery',
        subtotal: 400.00,
        delivery_fee: 40.00,
        tax: 20.00,
        total_amount: 460.00,
        status: 'Delivered',
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        items: [
            {
                order_item_id: 1,
                order_id: 1001,
                food_id: 1,
                food_name: 'Crispy Ghee Podi Masala Dosa',
                price: 140.00,
                quantity: 1,
                subtotal: 140.00,
                image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80'
            },
            {
                order_item_id: 2,
                order_id: 1001,
                food_id: 5,
                food_name: 'Paneer Butter Masala',
                price: 260.00,
                quantity: 1,
                subtotal: 260.00,
                image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80'
            }
        ]
    }
];
