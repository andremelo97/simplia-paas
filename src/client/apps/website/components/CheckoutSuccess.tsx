import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Mail, ArrowRight, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function CheckoutSuccess() {
  return (
    <section className="min-h-[80vh] flex items-center justify-center py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Success Icon */}
          <div className="w-24 h-24 bg-gradient-to-br from-[#5ED6CE] to-[#0a8a80] rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
            Obrigado por escolher o TQ!
          </h1>

          {/* Message */}
          <p className="text-xl text-gray-600 mb-4 leading-relaxed">
            Seu pagamento foi processado com sucesso.
          </p>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Em instantes, você receberá um e-mail com suas credenciais de acesso.
          </p>

          {/* Email Notice */}
          <div className="bg-gradient-to-r from-[#5ED6CE]/10 to-[#B725B7]/10 border border-[#5ED6CE]/30 rounded-xl p-6 mb-10">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-[#0a8a80]" />
              <span className="font-semibold text-gray-800">Não recebeu o e-mail?</span>
            </div>
            <p className="text-gray-600">
              Verifique sua caixa de spam ou entre em contato com nosso suporte em{' '}
              <a href="mailto:admin@livocare.ai" className="text-[#B725B7] font-semibold hover:underline">
                admin@livocare.ai
              </a>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://hub.livocare.ai"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#B725B7] to-[#E91E63] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Acessar o TQ
              <ArrowRight className="w-5 h-5" />
            </a>
            <Link
              to="/products/tq"
              className="w-full sm:w-auto px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-[#B725B7] hover:text-[#B725B7] transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar para o TQ
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
