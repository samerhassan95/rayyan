'use client'

import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await axios.post(`${API_URL}/auth/login`, formData)
      setMessage('✅ Login successful!')
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      setTimeout(() => router.push('/'), 1500)
    } catch (error: any) {
      setMessage(`❌ ${error.response?.data?.error || 'Login failed'}`)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '400px', margin: '50px auto' }}>
        <h2>Login to Rayyan</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary">
            Login
          </button>
        </form>

        {message && (
          <div style={{ marginTop: '16px', padding: '8px', borderRadius: '4px', backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da' }}>
            {message}
          </div>
        )}

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <a href="/auth/register">Don't have an account? Register</a>
          <br />
          <a href="/">← Back to Home</a>
        </div>
      </div>
    </div>
  )
}