const bcrypt = require('bcryptjs')
const User = require('../models/User')
const Product = require('../models/Product')
const Order = require('../models/Order')
const Policy = require('../models/Policy')
const Conversation = require('../models/Conversation')
const Message = require('../models/Message')
const Session = require('../models/Session')
const { demoUsers, demoProducts, demoOrders, demoPolicies } = require('../data/demoData')

const reconcileDuplicateAccounts = async () => {
  const duplicateGroups = await User.aggregate([
    { $group: { _id: '$email', ids: { $push: '$_id' }, roles: { $addToSet: '$role' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ])

  for (const group of duplicateGroups) {
    if (group.roles.length !== 1) {
      throw new Error('Duplicate accounts have conflicting roles; resolve them manually before startup.')
    }

    const accounts = await Promise.all(group.ids.map(async (id) => {
      const [orders, conversations, user] = await Promise.all([
        Order.countDocuments({ customerId: String(id) }),
        Conversation.countDocuments({ userId: String(id) }),
        User.findById(id).select('_id createdAt').lean(),
      ])
      return { id: String(id), orders, conversations, createdAt: user.createdAt }
    }))
    accounts.sort((left, right) =>
      (right.orders + right.conversations) - (left.orders + left.conversations) ||
      left.createdAt - right.createdAt,
    )
    const [canonical, ...duplicates] = accounts

    for (const duplicate of duplicates) {
      await Promise.all([
        Order.updateMany({ customerId: duplicate.id }, { $set: { customerId: canonical.id } }),
        Conversation.updateMany({ userId: duplicate.id }, { $set: { userId: canonical.id } }),
        Message.updateMany({ userId: duplicate.id }, { $set: { userId: canonical.id } }),
        Session.deleteMany({ userId: duplicate.id }),
      ])
      await User.deleteOne({ _id: duplicate.id })
    }
    console.warn('Merged duplicate account records; linked data was preserved and old sessions were revoked.')
  }
}

const ensureUserIndexes = async () => {
  await User.collection.createIndex({ email: 1 }, { unique: true, name: 'email_unique' })
  const indexes = await User.collection.indexes()
  if (indexes.some((index) => index.name === 'single_admin_role')) {
    await User.collection.dropIndex('single_admin_role')
  }

  await Promise.all([
    User.collection.createIndex({ role: 1, isActive: 1 }, { name: 'role_1_isActive_1' }),
  ])
}

const ensureBusinessIndexes = async () => {
  await Promise.all([
    Product.init(),
    Order.init(),
    Policy.init(),
    Conversation.init(),
    Message.init(),
    Session.init(),
  ])
}

const seedDatabase = async () => {
  await reconcileDuplicateAccounts()
  await ensureUserIndexes()
  await ensureBusinessIndexes()

  const demoCustomers = demoUsers.filter((user) => user.role === 'customer')

  await Promise.all(
    demoCustomers.map((customer) =>
      User.updateOne(
        { email: customer.email },
        {
          $setOnInsert: {
            name: customer.name,
            email: customer.email,
            password: customer.password,
            role: 'customer',
            isActive: true,
          },
        },
        { upsert: true, runValidators: true },
      ),
    ),
  )

  const configuredAdminEmail = (process.env.ADMIN_EMAIL || 'admin@luma.com').toLowerCase()
  const configuredPassword = process.env.ADMIN_PASSWORD || 'demo123'
  const configuredAdmin = demoUsers.find((user) => user.email === configuredAdminEmail)
  const password = await bcrypt.hash(configuredPassword, 12)

  await User.updateOne(
    { email: configuredAdminEmail },
    {
      $set: {
        name: process.env.ADMIN_NAME || configuredAdmin?.name || 'Store Administrator',
        email: configuredAdminEmail,
        password,
        role: 'admin',
        isActive: true,
      },
    },
    { upsert: true, runValidators: true },
  )

  await Promise.all(
    demoProducts.map((product) =>
      Product.updateOne(
        { id: product.id },
        {
          $setOnInsert: {
            ...product,
            sku: product.id,
            description: '',
            isActive: true,
          },
        },
        { upsert: true, runValidators: true },
      ),
    ),
  )

  await Promise.all(
    demoPolicies.map((policy) => {
      const id = policy.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      return Policy.updateOne(
        { id },
        {
          $setOnInsert: {
            ...policy,
            id,
            category: id,
            isActive: true,
          },
        },
        { upsert: true, runValidators: true },
      )
    }),
  )

  const seededCustomers = await User.find({ email: { $in: demoCustomers.map((user) => user.email) } })
    .select('_id email')
    .lean()
  const userIdsByEmail = new Map(seededCustomers.map((user) => [user.email, String(user._id)]))

  await Promise.all(
    demoOrders.map((order) => {
      const customerId = userIdsByEmail.get(order.customer)
      if (!customerId) {
        throw new Error(`Cannot seed order ${order.id}: demo customer account is missing.`)
      }

      const product = demoProducts.find((item) => item.name === order.item)
      const price = product?.price ?? 0
      return Order.updateOne(
        { id: order.id },
        {
          $setOnInsert: {
            ...order,
            customerId,
            items: [{ productId: product?.id || '', name: order.item, quantity: 1, unitPrice: price }],
          },
        },
        { upsert: true, runValidators: true },
      )
    }),
  )
}

module.exports = { seedDatabase }
