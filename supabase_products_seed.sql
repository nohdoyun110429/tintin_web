-- Seed products from data/products.json
INSERT INTO products (
  id,
  name,
  name_kr,
  description,
  price,
  image_url,
  damage,
  fire_rate,
  weight,
  type,
  is_recommended,
  lore
) VALUES
  (
    '1',
    'Shadow Glock',
    '그림자 글록',
    'Quiet but deadly. +50 Stealth.',
    2500,
    '/weapons/shadow-glock.svg',
    45,
    75,
    20,
    'pistol',
    false,
    'Forged in the depths of an abandoned Soviet bunker, this pistol has silenced more targets than any weapon in the underground. Its black ceramic coating absorbs all light, making it invisible in darkness. Former owners report hearing whispers from the barrel after midnight kills.'
  ),
  (
    '2',
    'C4 Plastic Explosive',
    'C4 폭탄',
    'Clears the room in 1 second. Area Damage 100%.',
    4500,
    '/weapons/c4-explosive.svg',
    100,
    0,
    40,
    'explosive',
    false,
    'Military-grade compound modified with an unstable isotope that doubles the blast radius. Each brick is hand-molded by a chemist who lost his entire team to a failed extraction. He puts a piece of his rage into every charge.'
  ),
  (
    '3',
    'Rusty Chainsaw',
    '녹슨 전기톱',
    'For close-range terror. Causes ''Bleeding'' effect.',
    3200,
    '/weapons/rusty-chainsaw.svg',
    85,
    60,
    75,
    'melee',
    false,
    'Recovered from an abandoned asylum where it was used for ''unofficial treatments''. The rust isn''t corrosion—it''s dried blood that has bonded with the metal. The engine still runs on the fear of its victims.'
  ),
  (
    '4',
    'Dark Katana',
    '암흑 카타나',
    'Slices through armor. Ignore Defense 30%.',
    5800,
    '/weapons/dark-katana.svg',
    70,
    45,
    25,
    'blade',
    false,
    'An ancient blade quenched in the blood of fallen warriors for over 400 years. Each new kill adds another soul to its edge. The steel has turned permanently black from absorbing the essence of the dead. Some say it swings itself toward enemies.'
  ),
  (
    '5',
    'The Annihilator (RPG-7)',
    '섬멸자 (RPG-7)',
    'The ultimate game changer. One shot, mass casualty. Cooldown: 60s.',
    12000,
    '/weapons/annihilator-rpg.svg',
    100,
    5,
    90,
    'launcher',
    true,
    'Stolen from a destroyed military convoy, this launcher has ended more sieges than any other weapon in existence. The warhead contains a modified payload that creates a vacuum effect, sucking everything into the blast zone. There is no escape radius. There is no mercy.'
  ),
  (
    '6',
    'Death Crossbow',
    '죽음의 석궁',
    'Silent and precise. Pierces through armor. +75 Accuracy.',
    6500,
    '/weapons/death-crossbow.svg',
    80,
    30,
    35,
    'crossbow',
    false,
    'Crafted by a master assassin who disappeared after completing his final contract. The crossbow''s limbs are made from the bones of ancient warriors, and the string is woven from the sinew of a legendary beast. Each bolt carries the weight of a thousand silent deaths. The trigger mechanism never jams, never fails—it only waits for the perfect moment to release death.'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_kr = EXCLUDED.name_kr,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  damage = EXCLUDED.damage,
  fire_rate = EXCLUDED.fire_rate,
  weight = EXCLUDED.weight,
  type = EXCLUDED.type,
  is_recommended = EXCLUDED.is_recommended,
  lore = EXCLUDED.lore,
  updated_at = NOW();

-- Sample customers (requires existing auth.users)
WITH sample_users AS (
  SELECT id
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 3
)
INSERT INTO customers (user_id, name, email, phone)
SELECT
  u.id,
  CASE
    WHEN row_number() OVER (ORDER BY u.id) = 1 THEN '김민수'
    WHEN row_number() OVER (ORDER BY u.id) = 2 THEN '이서연'
    ELSE '박지훈'
  END AS name,
  CASE
    WHEN row_number() OVER (ORDER BY u.id) = 1 THEN 'minsu@example.com'
    WHEN row_number() OVER (ORDER BY u.id) = 2 THEN 'seoyeon@example.com'
    ELSE 'jihun@example.com'
  END AS email,
  CASE
    WHEN row_number() OVER (ORDER BY u.id) = 1 THEN '010-1234-5678'
    WHEN row_number() OVER (ORDER BY u.id) = 2 THEN '010-2345-6789'
    ELSE '010-3456-7890'
  END AS phone
FROM sample_users u
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- Sample orders (uses first two users)
WITH order_users AS (
  SELECT id
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 2
)
INSERT INTO orders (user_id, order_number, amount, status, items)
SELECT
  u.id,
  CASE
    WHEN row_number() OVER (ORDER BY u.id) = 1 THEN 'ORD-SAMPLE-0001'
    ELSE 'ORD-SAMPLE-0002'
  END AS order_number,
  CASE
    WHEN row_number() OVER (ORDER BY u.id) = 1 THEN 7000
    ELSE 12000
  END AS amount,
  'completed' AS status,
  CASE
    WHEN row_number() OVER (ORDER BY u.id) = 1 THEN
      jsonb_build_array(
        jsonb_build_object(
          'id', '1',
          'name', 'Shadow Glock',
          'quantity', 1,
          'price', 2500
        ),
        jsonb_build_object(
          'id', '3',
          'name', 'Rusty Chainsaw',
          'quantity', 1,
          'price', 3200
        ),
        jsonb_build_object(
          'id', '2',
          'name', 'C4 Plastic Explosive',
          'quantity', 1,
          'price', 4500
        )
      )
    ELSE
      jsonb_build_array(
        jsonb_build_object(
          'id', '5',
          'name', 'The Annihilator (RPG-7)',
          'quantity', 1,
          'price', 12000
        )
      )
  END AS items
FROM order_users u
ON CONFLICT (order_number) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  amount = EXCLUDED.amount,
  status = EXCLUDED.status,
  items = EXCLUDED.items,
  updated_at = NOW();

