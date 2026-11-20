const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function seedDatabase() {
    console.log('🌱 Starting Database Initialization and Seeding...');

    const host = process.env.DB_HOST || 'localhost';
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || 'sivanesh';
    const dbName = process.env.DB_NAME || 'food_ordering_db';
    const port = parseInt(process.env.DB_PORT, 10) || 3306;

    // Connect to MySQL server (without selecting DB first)
    const connection = await mysql.createConnection({
        host,
        user,
        password,
        port
    });

    try {
        console.log(`Creating database "${dbName}" if it doesn't exist...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await connection.query(`USE \`${dbName}\`;`);

        console.log('Creating tables...');

        // 1. Customers table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS customers (
                customer_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(120) NOT NULL UNIQUE,
                phone VARCHAR(20) NOT NULL,
                address VARCHAR(255) NOT NULL,
                city VARCHAR(50) NOT NULL,
                state VARCHAR(50) NOT NULL,
                pincode VARCHAR(20) NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);

        // 2. Admins table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS admins (
                admin_id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(120) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'admin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);

        // 3. Restaurants table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS restaurants (
                restaurant_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                cuisine VARCHAR(100) NOT NULL,
                address VARCHAR(255) NOT NULL,
                rating DECIMAL(2,1) DEFAULT 4.5,
                image_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);

        // 4. Food Items table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS food_items (
                food_id INT AUTO_INCREMENT PRIMARY KEY,
                restaurant_id INT NOT NULL,
                name VARCHAR(150) NOT NULL,
                category VARCHAR(50) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                is_available BOOLEAN DEFAULT TRUE,
                image_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);

        // 5. Orders table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS orders (
                order_id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                customer_name VARCHAR(100) NOT NULL,
                delivery_phone VARCHAR(20) NOT NULL,
                delivery_address VARCHAR(255) NOT NULL,
                delivery_city VARCHAR(50) NOT NULL,
                delivery_state VARCHAR(50) NOT NULL,
                delivery_pincode VARCHAR(20) NOT NULL,
                special_instructions TEXT,
                payment_method VARCHAR(50) DEFAULT 'Cash on Delivery',
                subtotal DECIMAL(10,2) NOT NULL,
                delivery_fee DECIMAL(10,2) DEFAULT 40.00,
                tax DECIMAL(10,2) DEFAULT 0.00,
                total_amount DECIMAL(10,2) NOT NULL,
                status ENUM('Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled') DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);

        // 6. Order Items table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                order_item_id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                food_id INT NOT NULL,
                food_name VARCHAR(150) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                quantity INT NOT NULL,
                subtotal DECIMAL(10,2) NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
                FOREIGN KEY (food_id) REFERENCES food_items(food_id)
            ) ENGINE=InnoDB;
        `);

        console.log('✅ Tables created successfully.');

        // Seed Admin User (username: admin, password: admin123)
        const [existingAdmins] = await connection.query('SELECT admin_id FROM admins WHERE username = ?', ['admin']);
        if (existingAdmins.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.query(`
                INSERT INTO admins (username, email, password, role)
                VALUES (?, ?, ?, ?)
            `, ['admin', 'admin@foodiehub.com', hashedPassword, 'superadmin']);
            console.log('✅ Seeded default admin: username=admin, password=admin123');
        }

        // Check if restaurants already seeded
        const [existingRestaurants] = await connection.query('SELECT COUNT(*) AS count FROM restaurants');
        if (existingRestaurants[0].count === 0) {
            console.log('Seeding demonstration restaurants...');
            const restaurants = [
                ['Madras Tiffin House', 'South Indian', '14 Gandhipuram, 5th Cross, Coimbatore', 4.8, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'],
                ['Spice Symphony Kitchen', 'North Indian', '88 Residency Road, Bangalore', 4.7, 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80'],
                ['Dragon Wok Express', 'Chinese', '23 Park Street, Kolkata', 4.6, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'],
                ['Pizzeria Bella Italia', 'Pizza & Italian', '45 MG Road, Koramangala, Bangalore', 4.9, 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=800&q=80'],
                ['The Burger & Grill Shack', 'Fast Food', '12 Brigade Road, Bangalore', 4.6, 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80'],
                ['Sweet Delights Patisserie', 'Desserts & Bakery', '99 Indiranagar 100ft Road, Bangalore', 4.8, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80']
            ];

            for (const r of restaurants) {
                await connection.query(
                    'INSERT INTO restaurants (name, cuisine, address, rating, image_url) VALUES (?, ?, ?, ?, ?)',
                    r
                );
            }
            console.log(`✅ Seeded ${restaurants.length} restaurants.`);
        }

        // Check if foods already seeded
        const [existingFoods] = await connection.query('SELECT COUNT(*) AS count FROM food_items');
        if (existingFoods[0].count === 0) {
            console.log('Seeding demonstration food items...');

            // Fetch restaurant IDs
            const [restRows] = await connection.query('SELECT restaurant_id, name FROM restaurants');
            const rMap = {};
            restRows.forEach(r => { rMap[r.name] = r.restaurant_id; });

            const foods = [
                // South Indian
                {
                    restaurant: 'Madras Tiffin House',
                    name: 'Crispy Ghee Podi Masala Dosa',
                    category: 'South Indian',
                    description: 'Golden fermented rice-lentil crepe slathered with pure desi ghee, gun powder, and stuffed with spiced potato masala. Served with 3 coconut chutneys and hot sambar.',
                    price: 140.00,
                    available: true,
                    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80'
                },
                {
                    restaurant: 'Madras Tiffin House',
                    name: 'Steamed Idli & Medu Vada Combo',
                    category: 'South Indian',
                    description: 'Two fluffy steamed rice cakes paired with two crispy golden lentil fritters, served piping hot with freshly grated coconut chutney and aromatic drumstick sambar.',
                    price: 110.00,
                    available: true,
                    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80'
                },
                {
                    restaurant: 'Madras Tiffin House',
                    name: 'Chettinad Chicken Biryani',
                    category: 'South Indian',
                    description: 'Traditional seeraga samba rice cooked with tender chicken pieces, stone-ground Chettinad spices, fresh mint, and star anise. Served with onion raita.',
                    price: 280.00,
                    available: true,
                    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80'
                },
                {
                    restaurant: 'Madras Tiffin House',
                    name: 'Mysore Masala Dosa',
                    category: 'South Indian',
                    description: 'Signature crispy Mysore dosa smeared with spicy red garlic-chutney paste and loaded with rich potato bhaji and fresh coriander.',
                    price: 160.00,
                    available: true,
                    image: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?auto=format&fit=crop&w=800&q=80'
                },

                // North Indian
                {
                    restaurant: 'Spice Symphony Kitchen',
                    name: 'Paneer Butter Masala',
                    category: 'North Indian',
                    description: 'Fresh melt-in-mouth cottage cheese cubes simmered in a rich, buttery, velvety tomato-cashew gravy scented with dried fenugreek leaves.',
                    price: 260.00,
                    available: true,
                    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80'
                },
                {
                    restaurant: 'Spice Symphony Kitchen',
                    name: 'Tandoori Butter Naan Basket',
                    category: 'North Indian',
                    description: 'Assortment of freshly baked leavened clay-oven flatbreads brushed generously with garlic butter and fresh cilantro.',
                    price: 90.00,
                    available: true,
                    image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80'
                },
                {
                    restaurant: 'Spice Symphony Kitchen',
                    name: 'Slow-Cooked Dal Makhani',
                    category: 'North Indian',
                    description: 'Whole black lentils and kidney beans simmered overnight with butter, cream, and slow-roasted whole spices for that legendary smoky aroma.',
                    price: 220.00,
                    available: true,
                    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80'
                },
                {
                    restaurant: 'Spice Symphony Kitchen',
                    name: 'Murgh Makhani (Butter Chicken)',
                    category: 'North Indian',
                    description: 'Smoked tandoori chicken cooked in a rich satin-smooth tomato makhani gravy with homemade white butter and fresh cream.',
                    price: 320.00,
                    available: true,
                    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80'
                },

                // Chinese
                {
                    restaurant: 'Dragon Wok Express',
                    name: 'Wok-Tossed Hakka Veg Noodles',
                    category: 'Chinese',
                    description: 'Traditional thin wheat noodles stir-fried in a fiery wok with crunchy julienned bell peppers, cabbage, scallions, and signature dark soy sauce.',
                    price: 180.00,
                    available: true,
                    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80'
                },
                {
                    restaurant: 'Dragon Wok Express',
                    name: 'Crispy Chilli Chicken Dry',
                    category: 'Chinese',
                    description: 'Crisp-fried boneless chicken cubes wok-tossed with fresh green chillies, garlic flakes, ginger, and pungent spring onion greens.',
                    price: 250.00,
                    available: true,
                    image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=80'
                },
                {
                    restaurant: 'Dragon Wok Express',
                    name: 'Schezwan Egg Fried Rice',
                    category: 'Chinese',
                    description: 'Fragrant long-grain basmati tossed with scrambled eggs, diced vegetables, and spicy Sichuan peppercorn red chilli paste.',
                    price: 210.00,
                    available: true,
                    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80'
                },
                {
                    restaurant: 'Dragon Wok Express',
                    name: 'Steamed Chicken Dim Sums (6 Pcs)',
                    category: 'Chinese',
                    description: 'Delicate translucent dumplings filled with minced spiced chicken and scallions, served with fiery garlic-chilli dip.',
                    price: 220.00,
                    available: true,
                    image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80'
                },

                // Fast Food
                {
                    restaurant: 'The Burger & Grill Shack',
                    name: 'Ultimate Double Cheese Crunch Burger',
                    category: 'Fast Food',
                    description: 'Two thick crispy spiced patties layered with double cheddar slices, crisp iceberg lettuce, caramelized onions, and secret smoked burger mayo.',
                    price: 230.00,
                    available: true,
                    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'
                },
                {
                    restaurant: 'The Burger & Grill Shack',
                    name: 'Loaded Peri-Peri Crinkle Fries',
                    category: 'Fast Food',
                    description: 'Golden crispy potato crinkle fries dusted with zesty African bird’s eye peri-peri seasoning and drizzled with warm melted cheese dip.',
                    price: 130.00,
                    available: true,
                    image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80'
                },
                {
                    restaurant: 'The Burger & Grill Shack',
                    name: 'Grilled Triple-Decker Club Sandwich',
                    category: 'Fast Food',
                    description: 'Toasted multi-grain bread packed with fresh cucumber, tomatoes, cheese slices, crispy corn and spiced mint coleslaw. Served with potato wafers.',
                    price: 170.00,
                    available: true,
                    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80'
                },
                {
                    restaurant: 'The Burger & Grill Shack',
                    name: 'Smoky BBQ Chicken Wings (6 Pcs)',
                    category: 'Fast Food',
                    description: 'Juicy succulent chicken wings batter-fried and drenched in thick, hickory-wood smoked barbecue glaze with toasted sesame seeds.',
                    price: 260.00,
                    available: true,
                    image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80'
                },

                // Pizza
                {
                    restaurant: 'Pizzeria Bella Italia',
                    name: 'Classic Margherita Wood-Fired Pizza',
                    category: 'Pizza',
                    description: 'Handcrafted sourdough base topped with San Marzano tomato sauce, fresh buffalo mozzarella, fragrant basil leaves, and extra-virgin olive oil.',
                    price: 340.00,
                    available: true,
                    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80'
                },
                {
                    restaurant: 'Pizzeria Bella Italia',
                    name: 'Farmhouse Garden Supreme Pizza',
                    category: 'Pizza',
                    description: 'Loaded with crunchy bell peppers, button mushrooms, ripe red onions, black Kalamata olives, juicy sweet corn, and 100% real mozzarella.',
                    price: 390.00,
                    available: true,
                    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80'
                },
                {
                    restaurant: 'Pizzeria Bella Italia',
                    name: 'Spicy Barbecue Chicken Pizza',
                    category: 'Pizza',
                    description: 'Tender shredded chicken chunks tossed in spicy sweet barbecue glaze, red onions, jalapenos, and melted smoked gouda and mozzarella.',
                    price: 440.00,
                    available: true,
                    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80'
                },
                {
                    restaurant: 'Pizzeria Bella Italia',
                    name: 'Tandoori Paneer Tikka Feast Pizza',
                    category: 'Pizza',
                    description: 'Indian fusion masterpiece featuring marinated chargrilled paneer cubes, capsicum, red paprika, and creamy tandoori mayo swirl on crispy crust.',
                    price: 410.00,
                    available: true,
                    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80'
                },

                // Desserts
                {
                    restaurant: 'Sweet Delights Patisserie',
                    name: 'Belgian Molten Choco Lava Cake',
                    category: 'Desserts',
                    description: 'Decadent warm dark chocolate sponge filled with a river of silky molten Belgian ganache. Served with Madagascar vanilla bean ice cream.',
                    price: 160.00,
                    available: true,
                    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80'
                },
                {
                    restaurant: 'Sweet Delights Patisserie',
                    name: 'Royal Shahi Gulab Jamun (2 Pcs)',
                    category: 'Desserts',
                    description: 'Warm soft khoya dumplings infused with green cardamom, soaked in saffron-infused rose sugar syrup and garnished with sliced pistachios.',
                    price: 110.00,
                    available: true,
                    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80'
                },
                {
                    restaurant: 'Sweet Delights Patisserie',
                    name: 'Kesar Pista Rasmalai Trio',
                    category: 'Desserts',
                    description: 'Tender cottage cheese discs soaked in sweetened, thickened saffron cardamom milk, topped with slivered almonds and fragrant silver vark.',
                    price: 150.00,
                    available: true,
                    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80'
                },
                {
                    restaurant: 'Sweet Delights Patisserie',
                    name: 'New York Baked Berry Cheesecake',
                    category: 'Desserts',
                    description: 'Velvety smooth cream cheese baked over a crunchy graham cracker crust, crowned with a vibrant homemade wild berry compote.',
                    price: 220.00,
                    available: true,
                    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80'
                }
            ];

            for (const f of foods) {
                const restId = rMap[f.restaurant] || 1;
                await connection.query(
                    `INSERT INTO food_items (restaurant_id, name, category, description, price, is_available, image_url)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [restId, f.name, f.category, f.description, f.price, f.available, f.image]
                );
            }
            console.log(`✅ Seeded ${foods.length} food items across all 6 categories.`);
        }

        console.log('🎉 Database initialization and demonstration seeding completed successfully!');
    } catch (err) {
        console.error('❌ Error during seeding:', err);
        throw err;
    } finally {
        await connection.end();
    }
}

// Execute if run directly
if (require.main === module) {
    seedDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = seedDatabase;
