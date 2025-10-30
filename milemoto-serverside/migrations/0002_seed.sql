INSERT INTO categories (name, slug) VALUES
('Brakes','brakes'),('Electrical','electrical'),('Engine','engine')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO products (title, slug, description, price_minor, stock, image_url) VALUES
('Premium Performance Spark Plug Set','premium-performance-spark-plug-set','Copper core plugs. OEM fit.', 4500, 12, NULL),
('Brake Pads','brake-pads','Low dust. Quiet stop.', 6500, 20, NULL),
('Alternator','alternator','High output alternator.', 15900, 5, NULL)
ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description), price_minor=VALUES(price_minor), stock=VALUES(stock), image_url=VALUES(image_url);

INSERT IGNORE INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p JOIN categories c ON p.slug='premium-performance-spark-plug-set' AND c.slug='engine'
UNION ALL
SELECT p.id, c.id FROM products p JOIN categories c ON p.slug='brake-pads' AND c.slug='brakes'
UNION ALL
SELECT p.id, c.id FROM products p JOIN categories c ON p.slug='alternator' AND c.slug='electrical');
