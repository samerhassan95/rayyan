'use client'

import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await axios.post(`${API_URL}/auth/register`, formData)
      setMessage('✅ Registration successful! Redirecting to login...')
      setTimeout(() => router.push('/auth/login'), 2000)
    } catch (error: any) {
      setMessage(`❌ ${error.response?.data?.error || 'Registration failed'}`)
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
        <h2>Register for Rayyan</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          
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
            Register
          </button>
        </form>

        {message && (
          <div style={{ marginTop: '16px', padding: '8px', borderRadius: '4px', backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da' }}>
            {message}
          </div>
        )}

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <a href="/auth/login">Already have an account? Login</a>
          <br />
          <a href="/">← Back to Home</a>
        </div>
      </div>
    </div>
  )
}