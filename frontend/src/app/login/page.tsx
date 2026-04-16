'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Image from 'next/image'
import robot from '/src/assets/images/login.svg'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, formData)
      const { token, user } = response.data

      setMessage('✅ Login successful!')
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      // Role-based redirection
      setTimeout(() => {
        if (user.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/dashboard') // User dashboard
        }
      }, 1000)
    } catch (error: any) {
      setMessage(`❌ ${error.response?.data?.error || 'Login failed'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className='h-screen flex justify-between items-center bg-[#e6e6e6]'>


      <div className="w-full md:w-1/2 p-8 h-[75vh] mx-4 
    bg-gradient-to-br from-white/35 from-55% to-[#D9FFFA]/35 to-100% 
    backdrop-blur-md 
    border border-white/20 rounded-2xl shadow-xl shadow-black/5">        <div className='mb-8 text-center flex justify-center items-center gap-2'>
          <h1 >
            RAYYAN
          </h1>
          <p style={{ color: '#718096', fontSize: '16px' }}>
            Welcome Back
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: '500',
              color: '#4a5568'
            }}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'border-color 0.2s ease'
              }}
              placeholder="Enter your email"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: '500',
              color: '#4a5568'
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'border-color 0.2s ease'
              }}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#a0aec0' : '#319795',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {message && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: message.includes('✅') ? '#f0fff4' : '#fed7d7',
            color: message.includes('✅') ? '#22543d' : '#742a2a',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#718096'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <span>Don't have an account?{' '}</span>
            <button
              type="button"
              onClick={() => router.push('/register')}
              style={{
                background: 'none',
                border: 'none',
                color: '#319795',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Sign Up
            </button>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <p><strong>Admin Login:</strong></p>
              <p>admin@rayyan.com / password</p>
            </div>
            <div>
              <p><strong>User Login:</strong></p>
              <p>sarah.j@architect.com / password123</p>
            </div>
          </div>
        </div>
      </div>
      <div className='hidden md:block md:w-1/2'>
        <Image src={robot} alt="Robot" className=' w-full h-auto' />
      </div>
    </div>
  )
}