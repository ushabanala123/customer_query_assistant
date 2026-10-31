const demoProducts = [
  { id: 'P-101', name: 'Aurora Wireless Headphones', stock: 28, price: 129, category: 'Audio', badge: 'Best seller' },
  { id: 'P-204', name: 'Luma Smartwatch', stock: 12, price: 219, category: 'Wearables', badge: 'Low stock' },
  { id: 'P-318', name: 'Nova Espresso Machine', stock: 9, price: 349, category: 'Kitchen', badge: 'New arrival' },
  { id: 'P-415', name: 'Terra Smart Lamp', stock: 41, price: 79, category: 'Home', badge: 'In stock' },
  { id: 'P-502', name: 'Breeze Noise-Canceling Earbuds', stock: 17, price: 99, category: 'Audio', badge: 'Popular' },
]

const demoOrders = [
  { id: 'ORD10245', customer: 'maya@luma.com', status: 'Shipped', eta: 'Tuesday', item: 'Aurora Wireless Headphones', total: '$129.00' },
  { id: 'ORD10481', customer: 'daniel@luma.com', status: 'Processing', eta: 'Awaiting dispatch', item: 'Luma Smartwatch', total: '$219.00' },
  { id: 'ORD10512', customer: 'priya@luma.com', status: 'Delivered', eta: 'Delivered Mar 12', item: 'Terra Smart Lamp', total: '$79.00' },
]

const demoPolicies = [
  { title: 'Returns', detail: 'Returns are accepted within 30 days for unused items with a receipt.' },
  { title: 'Refunds', detail: 'Refunds are issued to the original payment method within 5–7 business days.' },
  { title: 'Shipping', detail: 'Standard shipping is free on orders over $75 in the continental U.S.' },
]

const demoUsers = [
  {
    id: 'user-demo-customer',
    name: 'Maya Carter',
    email: 'maya@luma.com',
    password: '$2a$10$M7jSLLrk3uPVuWLkuN3f4uR0szqs1P9ILaESTUMuoGvh076RjOvha',
    role: 'customer',
  },
  {
    id: 'user-demo-customer-daniel',
    name: 'Daniel Rivera',
    email: 'daniel@luma.com',
    password: '$2a$10$M7jSLLrk3uPVuWLkuN3f4uR0szqs1P9ILaESTUMuoGvh076RjOvha',
    role: 'customer',
  },
  {
    id: 'user-demo-customer-priya',
    name: 'Priya Shah',
    email: 'priya@luma.com',
    password: '$2a$10$M7jSLLrk3uPVuWLkuN3f4uR0szqs1P9ILaESTUMuoGvh076RjOvha',
    role: 'customer',
  },
  {
    id: 'user-demo-admin',
    name: 'Olivia Chen',
    email: 'admin@luma.com',
    password: '$2a$10$1YhqrOSX/gWpQ46QcVZVJu8uZiouvm7DzPyGETfgmyHCXegfAHyEO',
    role: 'admin',
  },
]

const conversationStore = []

module.exports = {
  demoProducts,
  demoOrders,
  demoPolicies,
  demoUsers,
  conversationStore,
}
