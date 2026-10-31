const { GoogleGenAI } = require('@google/genai')
const Product = require('../models/Product')
const Order = require('../models/Order')
const Policy = require('../models/Policy')

const isOrderQuestion = (question) => /order|shipment|delivery|tracking|status/.test(question)
const isProductQuestion = (question) => /stock|inventory|available|product|sku|price/.test(question)
const isPolicyQuestion = (question) => /refund|return|cancel|money back|shipping|policy|support|warranty|hours/.test(question)

const selectBusinessData = async (question, user) => {
  const query = question.trim().toLowerCase()

  if (isOrderQuestion(query)) {
    if (!user) {
      return {
        type: 'private-order',
        records: [],
        fallback: 'Please sign in to view private order details. Customers can only check their own orders after authentication.',
      }
    }

    const orders = await Order.find(user.role === 'admin' ? {} : { customerId: user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
    const orderNumber = query.match(/\bord[a-z0-9-]+\b/i)?.[0]
    const matchedOrder = orderNumber
      ? orders.find((order) => order.id.toLowerCase() === orderNumber.toLowerCase())
      : orders.find((order) => query.includes(order.item.toLowerCase().split(' ')[0])) || orders[0]

    if (!matchedOrder) {
      return {
        type: 'private-order',
        records: [],
        fallback: 'I could not find that order in your account. Please check the order number or contact support.',
      }
    }

    return {
      type: 'private-order',
      records: [{
        id: matchedOrder.id,
        item: matchedOrder.item,
        status: matchedOrder.status,
        expectedDelivery: matchedOrder.eta,
      }],
      fallback: `${matchedOrder.item} is ${matchedOrder.status.toLowerCase()} and is expected ${matchedOrder.eta.toLowerCase()}.`,
    }
  }

  if (isProductQuestion(query)) {
    const products = await Product.find({ isActive: true }).sort({ name: 1 }).lean()
    const matchedProduct = products.find((product) =>
      query.includes(product.sku.toLowerCase()) ||
      query.includes(product.name.toLowerCase()) ||
      product.name.toLowerCase().split(' ').some((word) => word.length > 3 && query.includes(word)),
    )
    if (matchedProduct) {
      return {
        type: 'product',
        records: [{
          sku: matchedProduct.sku,
          name: matchedProduct.name,
          description: matchedProduct.description,
          price: matchedProduct.price,
          stock: matchedProduct.stock,
        }],
        fallback: matchedProduct.stock > 0
          ? `${matchedProduct.name} has ${matchedProduct.stock} units available and costs $${matchedProduct.price.toFixed(2)}.`
          : `${matchedProduct.name} is currently out of stock.`,
      }
    }

    if (!products.length) {
      return { type: 'product', records: [], fallback: 'I cannot confirm product availability right now.' }
    }

    return {
      type: 'product',
      records: products.map(({ sku, name, stock, price }) => ({ sku, name, stock, price })),
      fallback: `There are ${products.length} active products in the catalog. Please ask about a product by name or SKU for its availability.`,
    }
  }

  if (isPolicyQuestion(query)) {
    const policies = await Policy.find({ isActive: true }).sort({ title: 1 }).lean()
    const matchedPolicies = policies.filter((policy) =>
      query.includes(policy.title.toLowerCase()) ||
      query.includes(policy.category.toLowerCase()) ||
      policy.title.toLowerCase().split(' ').some((word) => word.length > 3 && query.includes(word)),
    )
    const records = matchedPolicies.length ? matchedPolicies : policies
    if (!records.length) {
      return { type: 'policy', records: [], fallback: 'I cannot confirm that store policy right now. Please contact support for current information.' }
    }
    return {
      type: 'policy',
      records: records.map(({ title, category, detail }) => ({ title, category, detail })),
      fallback: records.map((policy) => `${policy.title}: ${policy.detail}`).join(' '),
    }
  }

  return {
    type: 'general',
    records: [],
    fallback: '',
  }
}

const generateAnswer = async (question, user = null) => {
  const businessData = await selectBusinessData(question, user)
  if (businessData.type === 'private-order' && !businessData.records.length) {
    return businessData.fallback
  }

  if (!process.env.GEMINI_API_KEY) {
    if (businessData.type === 'general') {
      const serviceError = new Error('Gemini is not configured. Set GEMINI_API_KEY on the backend to answer general questions.')
      serviceError.status = 503
      throw serviceError
    }

    return businessData.fallback
  }

  const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { timeout: 20000 },
  })
  try {
    const response = await client.interactions.create({
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      input: JSON.stringify({ question, businessData: businessData.records }),
      system_instruction: 'Be a helpful general assistant and answer general questions normally. For store-specific questions, use only the verified businessData in the input. Never invent store facts, change order status, initiate refunds, or reveal private data not supplied.',
      generation_config: { thinking_level: 'low', max_output_tokens: 256 },
    })
    const answer = response.output_text?.trim()
    if (answer) return answer

    throw new Error('Gemini returned an empty response.')
  } catch (error) {
    const providerStatus = Number(error.status || error.code)
    const providerMessage = String(error.message || '')
    console.error('Gemini provider request failed:', {
      status: providerStatus || 'unknown',
      message: providerMessage,
    })
    const message = providerStatus === 429 || /quota|rate limit/i.test(providerMessage)
      ? 'Gemini API quota or rate limit reached. Check your Google AI Studio usage limits and retry when quota is available.'
      : providerStatus === 504 || /DEADLINE_EXCEEDED|deadline expired|timed out/i.test(providerMessage)
        ? 'Gemini took too long to respond. Please try again in a moment.'
        : providerStatus === 400 || providerStatus === 401 || providerStatus === 403
          ? 'Gemini rejected the request. Check that GEMINI_API_KEY and GEMINI_MODEL are valid and enabled for your account.'
          : 'The AI assistant is temporarily unavailable. Please try your question again.'
    const serviceError = new Error(message)
    serviceError.status = 503
    throw serviceError
  }
}

module.exports = { generateAnswer }
