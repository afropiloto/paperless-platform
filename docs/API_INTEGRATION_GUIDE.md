# API Integration Guide for UI Developers

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [User Management](#user-management)
4. [MFA Integration](#mfa-integration)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)
7. [Code Examples](#code-examples)

## Overview

This guide provides comprehensive instructions for integrating with the Trade Documents Platform API for user management and authentication. The API supports both **Sign-In with Ethereum (SIWE)** and **email/password** authentication with **Multi-Factor Authentication (MFA)**.

### Base URL
```
https://api.tradedocs.com
```

### API Version
All endpoints use version 1 of the API.

## Authentication

### Authentication Methods

The platform supports two authentication methods:

1. **Sign-In with Ethereum (SIWE)** - Web3 wallet-based authentication
2. **Email/Password** - Traditional email and password authentication

### JWT Tokens

After successful authentication, you'll receive:
- **Access Token** - Valid for 15 minutes, used for API requests
- **Refresh Token** - Valid for 7 days, used to get new access tokens

### Token Usage

Include the access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## User Management

### 1. Creating Users

#### Single User Creation
```javascript
const createUser = async (userData) => {
  const response = await fetch('/auth/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      accountId: '507f1f77bcf86cd799439011',
      name: 'John Doe',
      emailAddress: 'john.doe@example.com',
      walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      permissions: [
        { module: 'DealDesk', role: 'Supervisor' },
        { module: 'Paiperless', role: 'Agent' }
      ],
      authMethod: 'email-password',
      enableMfa: true,
      sendInvitation: true,
      inviterId: '507f1f77bcf86cd799439012',
      inviterName: 'Admin User'
    })
  });
  
  return response.json();
};
```

#### Bulk User Creation
```javascript
const bulkCreateUsers = async (usersData) => {
  const response = await fetch('/auth/users/bulk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      accountId: '507f1f77bcf86cd799439011',
      users: [
        {
          name: 'John Doe',
          emailAddress: 'john.doe@example.com',
          walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          permissions: [{ module: 'DealDesk', role: 'Supervisor' }],
          authMethod: 'email-password',
          enableMfa: true,
          sendInvitation: true
        },
        {
          name: 'Jane Smith',
          emailAddress: 'jane.smith@example.com',
          walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b7',
          permissions: [{ module: 'Paiperless', role: 'Agent' }],
          authMethod: 'email-password',
          enableMfa: false,
          sendInvitation: true
        }
      ],
      sendInvitations: true,
      inviterId: '507f1f77bcf86cd799439012',
      inviterName: 'Admin User'
    })
  });
  
  return response.json();
};
```

### 2. User Invitation

```javascript
const inviteUser = async (userId, message = null) => {
  const response = await fetch('/auth/users/invite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      userId: userId,
      message: message,
      inviterId: '507f1f77bcf86cd799439012',
      inviterName: 'Admin User'
    })
  });
  
  return response.json();
};
```

### 3. User Status Management

```javascript
const updateUserStatus = async (userId, status, reason = null) => {
  const response = await fetch('/auth/users/status', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      userId: userId,
      status: status, // 'active', 'inactive', 'locked'
      reason: reason,
      updaterId: '507f1f77bcf86cd799439012',
      updaterName: 'Admin User'
    })
  });
  
  return response.json();
};
```

### 4. User Search

```javascript
const searchUsers = async (accountId, filters = {}) => {
  const params = new URLSearchParams({
    accountId: accountId,
    ...filters
  });
  
  const response = await fetch(`/auth/users/search?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  return response.json();
};

// Example usage
const users = await searchUsers('507f1f77bcf86cd799439011', {
  name: 'John',
  status: 'active',
  mfaEnabled: true,
  page: 1,
  limit: 10
});
```

### 5. Get User by ID

```javascript
const getUserById = async (userId) => {
  const response = await fetch(`/auth/users/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  return response.json();
};
```

## Authentication Flows

### 1. SIWE Authentication

```javascript
const siweLogin = async (message, signature) => {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: message,
      signature: signature
    })
  });
  
  return response.json();
};

// Complete SIWE flow
const completeSiweLogin = async (walletAddress) => {
  // 1. Get nonce
  const nonceResponse = await fetch(`/auth/nonce/${walletAddress}`);
  const { nonce, message } = await nonceResponse.json();
  
  // 2. Sign message with wallet (client-side)
  const signature = await signMessage(message, walletAddress);
  
  // 3. Login with signature
  const loginResponse = await siweLogin(message, signature);
  
  return loginResponse;
};
```

### 2. Email/Password Authentication

```javascript
const emailLogin = async (email, password) => {
  const response = await fetch('/auth/login/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email,
      password: password
    })
  });
  
  return response.json();
};
```

### 3. Token Refresh

```javascript
const refreshToken = async (refreshToken) => {
  const response = await fetch('/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      refreshToken: refreshToken
    })
  });
  
  return response.json();
};
```

### 4. Password Management

```javascript
// Change password
const changePassword = async (userId, currentPassword, newPassword) => {
  const response = await fetch('/auth/password/change', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: userId,
      currentPassword: currentPassword,
      newPassword: newPassword
    })
  });
  
  return response.json();
};

// Forgot password
const forgotPassword = async (email) => {
  const response = await fetch('/auth/password/forgot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email
    })
  });
  
  return response.json();
};

// Reset password
const resetPassword = async (token, newPassword) => {
  const response = await fetch('/auth/password/reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      token: token,
      newPassword: newPassword
    })
  });
  
  return response.json();
};
```

### 5. Forgot Password Management

The forgot password flow consists of two main steps:
1. **Request Password Reset** - User enters their email
2. **Reset Password** - User clicks link from email and sets new password

#### **Step 1: Request Password Reset**

```javascript
// Request password reset
const requestPasswordReset = async (email) => {
  const response = await fetch('/auth/password/forgot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  });
  
  return response.json();
};
```

#### **Step 2: Reset Password**

```javascript
// Reset password with token from email
const resetPasswordWithToken = async (token, newPassword) => {
  const response = await fetch('/auth/password/reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      token: token,
      newPassword: newPassword
    })
  });
  
  return response.json();
};
```

#### **Complete React Implementation**

```jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

// Forgot Password Request Component
const ForgotPasswordRequest = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/auth/password/forgot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        onSuccess?.();
      } else {
        setError(result.message || 'Failed to send reset email');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="forgot-password-success">
        <div className="success-icon">✓</div>
        <h2>Check Your Email</h2>
        <p>
          If an account with the email <strong>{email}</strong> exists, 
          we've sent you a password reset link.
        </p>
        <p className="note">
          The link will expire in 30 minutes for security reasons.
        </p>
        <button 
          onClick={() => window.location.href = '/login'}
          className="btn-primary"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="forgot-password-request">
      <h2>Forgot Your Password?</h2>
      <p>Enter your email address and we'll send you a link to reset your password.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            disabled={loading}
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          type="submit" 
          className="btn-primary"
          disabled={loading || !email}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      
      <div className="links">
        <a href="/login">Back to Login</a>
      </div>
    </div>
  );
};

// Password Reset Component
const PasswordReset = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join(', '));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/auth/password/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token,
          newPassword: newPassword
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message || 'Failed to reset password');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="password-reset-error">
        <h2>Invalid Reset Link</h2>
        <p>The password reset link is invalid or has expired.</p>
        <button 
          onClick={() => navigate('/forgot-password')}
          className="btn-primary"
        >
          Request New Reset Link
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="password-reset-success">
        <div className="success-icon">✓</div>
        <h2>Password Reset Successful</h2>
        <p>Your password has been reset successfully. You can now log in with your new password.</p>
        <button 
          onClick={() => navigate('/login')}
          className="btn-primary"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="password-reset">
      <h2>Reset Your Password</h2>
      <p>Enter your new password below.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            required
            disabled={loading}
          />
          <small>
            Password must be at least 8 characters and contain uppercase, lowercase, 
            number, and special character.
          </small>
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            disabled={loading}
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          type="submit" 
          className="btn-primary"
          disabled={loading || !newPassword || !confirmPassword}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
};

// Main Forgot Password Component
const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // If token is present, show reset form, otherwise show request form
  if (token) {
    return <PasswordReset />;
  }

  return <ForgotPasswordRequest />;
};

export default ForgotPassword;
```

#### **CSS Styles for Forgot Password Components**

```css
/* Forgot Password Styles */
.forgot-password-request,
.password-reset,
.forgot-password-success,
.password-reset-success,
.password-reset-error {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.forgot-password-request h2,
.password-reset h2,
.forgot-password-success h2,
.password-reset-success h2,
.password-reset-error h2 {
  margin-bottom: 1rem;
  text-align: center;
  color: #333;
}

.forgot-password-request p,
.password-reset p,
.forgot-password-success p,
.password-reset-success p,
.password-reset-error p {
  margin-bottom: 1.5rem;
  text-align: center;
  color: #666;
  line-height: 1.5;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #666;
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  padding: 0.75rem;
  margin-bottom: 1rem;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  font-size: 0.875rem;
}

.success-icon {
  text-align: center;
  font-size: 3rem;
  color: #28a745;
  margin-bottom: 1rem;
}

.links {
  margin-top: 1.5rem;
  text-align: center;
}

.links a {
  color: #007bff;
  text-decoration: none;
}

.links a:hover {
  text-decoration: underline;
}

.note {
  font-size: 0.875rem;
  color: #666;
  font-style: italic;
}
```

#### **Usage in React Router**

```jsx
// App.js or your router configuration
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ForgotPassword from './components/ForgotPassword';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ForgotPassword />} />
        {/* Other routes */}
      </Routes>
    </Router>
  );
}
```

#### **Security Considerations**

1. **Token Expiry**: Reset tokens expire after 30 minutes
2. **Rate Limiting**: Implement rate limiting on forgot password requests
3. **Email Validation**: Always return the same message regardless of email existence
4. **HTTPS Only**: Ensure all password reset links use HTTPS
5. **Token Security**: Tokens should be cryptographically secure and single-use

#### **Error Handling**

```javascript
// Handle common error scenarios
const handleForgotPasswordError = (error) => {
  switch (error.status) {
    case 400:
      return 'Please enter a valid email address';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Server error. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};
```

#### **API Response Examples**

```javascript
// Successful forgot password request
{
  "success": true,
  "message": "If the email exists, a reset link will be sent."
}

// Successful password reset
{
  "success": true,
  "message": "Password has been reset successfully"
}

// Invalid token
{
  "success": false,
  "message": "Invalid or expired reset token"
}

// Weak password
{
  "success": false,
  "message": "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character"
}
```

## MFA Integration

### 1. MFA Setup

```javascript
const setupMfa = async (userId) => {
  const response = await fetch('/auth/mfa/setup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: userId
    })
  });
  
  return response.json();
};

// Complete MFA setup flow
const completeMfaSetup = async (userId, totpCode) => {
  // 1. Setup MFA
  const setupResponse = await setupMfa(userId);
  const { qrCodeUrl, secret, backupCodes } = setupResponse;
  
  // 2. Display QR code to user
  displayQrCode(qrCodeUrl);
  
  // 3. Verify with TOTP code
  const verifyResponse = await fetch('/auth/mfa/verify-setup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: userId,
      totpCode: totpCode
    })
  });
  
  return verifyResponse.json();
};
```

### 2. MFA Verification

```javascript
const verifyMfa = async (userId, code, isBackupCode = false) => {
  const response = await fetch('/auth/mfa/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: userId,
      code: code,
      isBackupCode: isBackupCode
    })
  });
  
  return response.json();
};
```

### 3. MFA Management

```javascript
// Disable MFA
const disableMfa = async (userId, currentPassword, verificationCode) => {
  const response = await fetch('/auth/mfa/disable', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: userId,
      currentPassword: currentPassword,
      verificationCode: verificationCode
    })
  });
  
  return response.json();
};

// Regenerate backup codes
const regenerateBackupCodes = async (userId, currentPassword, totpCode) => {
  const response = await fetch('/auth/mfa/regenerate-backup-codes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: userId,
      currentPassword: currentPassword,
      totpCode: totpCode
    })
  });
  
  return response.json();
};

// Get MFA status
const getMfaStatus = async (userId) => {
  const response = await fetch(`/auth/mfa/status/${userId}`);
  return response.json();
};
```

### 4. Changing Authenticator App

If a user needs to change their authenticator app (e.g., switching from Google Authenticator to Authy, or getting a new phone), they can do so by following this workflow:

#### **Option 1: Disable and Re-setup MFA (Recommended)**

This is the most secure approach as it generates a completely new secret:

```javascript
// Complete workflow to change authenticator app
const changeAuthenticatorApp = async (userId, currentPassword, currentMfaCode) => {
  try {
    // Step 1: Disable current MFA
    const disableResponse = await fetch('/auth/mfa/disable', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId,
        currentPassword: currentPassword,
        verificationCode: currentMfaCode
      })
    });
    
    const disableResult = await disableResponse.json();
    
    if (!disableResult.success) {
      throw new Error(`Failed to disable MFA: ${disableResult.message}`);
    }
    
    // Step 2: Setup new MFA
    const setupResponse = await fetch('/auth/mfa/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId
      })
    });
    
    const setupResult = await setupResponse.json();
    
    if (!setupResult.success) {
      throw new Error(`Failed to setup new MFA: ${setupResult.message}`);
    }
    
    return {
      success: true,
      message: 'Authenticator app change initiated successfully',
      qrCodeUrl: setupResult.qrCodeUrl,
      secret: setupResult.secret,
      backupCodes: setupResult.backupCodes,
      requiresVerification: true
    };
    
  } catch (error) {
    throw new Error(`Failed to change authenticator app: ${error.message}`);
  }
};

// Step 3: Verify the new setup
const verifyNewAuthenticatorSetup = async (userId, newTotpCode) => {
  const response = await fetch('/auth/mfa/verify-setup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: userId,
      totpCode: newTotpCode
    })
  });
  
  return response.json();
};
```

#### **Option 2: Manual Secret Transfer (Advanced Users Only)**

For advanced users who want to transfer their existing secret to a new authenticator app:

```javascript
// Get current MFA secret (requires admin privileges or special endpoint)
const getCurrentMfaSecret = async (userId, currentPassword, currentMfaCode) => {
  // Note: This endpoint may not exist in the current API
  // It would require additional implementation
  const response = await fetch('/auth/mfa/secret', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: userId,
      currentPassword: currentPassword,
      verificationCode: currentMfaCode
    })
  });
  
  return response.json();
};
```

#### **UI Implementation for Changing Authenticator App**

```jsx
import React, { useState } from 'react';

const ChangeAuthenticatorApp = ({ userId }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [currentMfaCode, setCurrentMfaCode] = useState('');
  const [newMfaCode, setNewMfaCode] = useState('');
  const [step, setStep] = useState('input'); // 'input', 'setup', 'verify'
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChangeAuthenticator = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Step 1: Disable current MFA
      const disableResponse = await fetch('/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          currentPassword: currentPassword,
          verificationCode: currentMfaCode
        })
      });

      const disableResult = await disableResponse.json();
      
      if (!disableResult.success) {
        throw new Error(disableResult.message);
      }

      // Step 2: Setup new MFA
      const setupResponse = await fetch('/auth/mfa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId })
      });

      const setupResult = await setupResponse.json();
      
      if (!setupResult.success) {
        throw new Error(setupResult.message);
      }

      setQrCodeUrl(setupResult.qrCodeUrl);
      setStep('setup');
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyNewSetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/auth/mfa/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          totpCode: newMfaCode
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setStep('verify');
        // Show success message and redirect
        alert('Authenticator app changed successfully!');
      } else {
        setError(result.message);
      }
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'setup') {
    return (
      <div className="mfa-setup">
        <h3>Setup New Authenticator App</h3>
        <p>Scan this QR code with your new authenticator app:</p>
        
        <div className="qr-code">
          <img src={qrCodeUrl} alt="QR Code for MFA Setup" />
        </div>
        
        <p>After scanning, enter the 6-digit code from your new app:</p>
        
        <form onSubmit={handleVerifyNewSetup}>
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={newMfaCode}
            onChange={(e) => setNewMfaCode(e.target.value)}
            maxLength={6}
            pattern="[0-9]{6}"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Setup'}
          </button>
        </form>
        
        {error && <div className="error">{error}</div>}
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="success">
        <h3>✅ Authenticator App Changed Successfully!</h3>
        <p>Your new authenticator app is now active. You can use it for future logins.</p>
        <button onClick={() => window.location.href = '/dashboard'}>
          Continue to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="change-authenticator">
      <h3>Change Authenticator App</h3>
      <p>To change your authenticator app, you'll need to:</p>
      <ol>
        <li>Verify your current password and MFA code</li>
        <li>Disable your current MFA setup</li>
        <li>Setup MFA with your new authenticator app</li>
      </ol>
      
      <form onSubmit={handleChangeAuthenticator}>
        <div>
          <label>Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label>Current MFA Code</label>
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={currentMfaCode}
            onChange={(e) => setCurrentMfaCode(e.target.value)}
            maxLength={6}
            pattern="[0-9]{6}"
            required
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Change Authenticator App'}
        </button>
      </form>
      
      {error && <div className="error">{error}</div>}
    </div>
  );
};
```

#### **Important Notes for Changing Authenticator Apps**

1. **Security Considerations**:
   - The disable and re-setup approach is more secure as it generates a new secret
   - Users should ensure they have backup codes available before starting the process
   - The process temporarily disables MFA, so users should complete it quickly

2. **User Experience**:
   - Provide clear instructions about the process
   - Show progress indicators during each step
   - Offer help text explaining why this process is necessary

3. **Error Handling**:
   - Handle cases where the user enters incorrect current credentials
   - Provide fallback options if the process fails
   - Allow users to cancel the process and keep their current setup

4. **Backup Codes**:
   - New backup codes are generated during the re-setup process
   - Users should be informed that old backup codes become invalid
   - Provide the new backup codes securely (via email)

#### **API Response Examples**

```javascript
// Successful disable response
{
  "success": true,
  "message": "MFA has been disabled successfully"
}

// Successful setup response
{
  "success": true,
  "message": "MFA setup initiated successfully. Please scan the QR code with your authenticator app.",
  "qrCodeUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "secret": "JBSWY3DPEHPK3PXP",
  "backupCodes": ["ABCD-EFGH-IJKL-MNOP", "QRST-UVWX-YZAB-CDEF"],
  "requiresVerification": true
}

// Successful verification response
{
  "success": true,
  "message": "MFA setup completed successfully"
}
```

## Error Handling

### Common Error Responses

```javascript
// 400 Bad Request
{
  "statusCode": 400,
  "message": "Invalid input data",
  "error": "Bad Request"
}

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}

// 429 Too Many Requests
{
  "statusCode": 429,
  "message": "Too many failed login attempts",
  "error": "Too Many Requests"
}
```

### Error Handling Utility

```javascript
const handleApiError = async (response) => {
  if (!response.ok) {
    const errorData = await response.json();
    
    switch (response.status) {
      case 400:
        throw new Error(`Bad Request: ${errorData.message}`);
      case 401:
        // Redirect to login
        window.location.href = '/login';
        break;
      case 403:
        throw new Error('Insufficient permissions');
      case 404:
        throw new Error('Resource not found');
      case 429:
        throw new Error('Too many requests. Please try again later.');
      default:
        throw new Error(`Server error: ${errorData.message}`);
    }
  }
  
  return response.json();
};
```

## Best Practices

### 1. Token Management

```javascript
class TokenManager {
  constructor() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }
  
  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }
  
  async refreshAccessToken() {
    try {
      const response = await refreshToken(this.refreshToken);
      this.setTokens(response.accessToken, this.refreshToken);
      return response.accessToken;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }
  
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
  
  async getValidToken() {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }
    
    // Check if token is expired (you can decode JWT to check expiration)
    // For simplicity, we'll always try to refresh
    try {
      return await this.refreshAccessToken();
    } catch (error) {
      throw error;
    }
  }
}
```

### 2. API Client

```javascript
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.tokenManager = new TokenManager();
  }
  
  async request(endpoint, options = {}) {
    const token = await this.tokenManager.getValidToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      },
      ...options
    };
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, config);
    return handleApiError(response);
  }
  
  // User management methods
  async createUser(userData) {
    return this.request('/auth/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }
  
  async searchUsers(accountId, filters) {
    const params = new URLSearchParams({ accountId, ...filters });
    return this.request(`/auth/users/search?${params}`);
  }
  
  async updateUserStatus(userId, status, reason) {
    return this.request('/auth/users/status', {
      method: 'PUT',
      body: JSON.stringify({ userId, status, reason })
    });
  }
}
```

### 3. Form Validation

```javascript
const validateUserData = (userData) => {
  const errors = [];
  
  if (!userData.name || userData.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (!userData.emailAddress || !isValidEmail(userData.emailAddress)) {
    errors.push('Valid email address is required');
  }
  
  if (!userData.walletAddress || !isValidWalletAddress(userData.walletAddress)) {
    errors.push('Valid Ethereum wallet address is required');
  }
  
  if (!userData.permissions || userData.permissions.length === 0) {
    errors.push('At least one permission is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

## Code Examples

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import { ApiClient } from './api-client';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const apiClient = new ApiClient('https://api.tradedocs.com');
  
  useEffect(() => {
    loadUsers();
  }, []);
  
  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userList = await apiClient.searchUsers('account-id', {
        status: 'active',
        page: 1,
        limit: 20
      });
      setUsers(userList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const createUser = async (userData) => {
    try {
      const newUser = await apiClient.createUser({
        ...userData,
        inviterId: 'current-user-id',
        inviterName: 'Current User'
      });
      
      setUsers([...users, newUser]);
      return newUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  const updateUserStatus = async (userId, status, reason) => {
    try {
      await apiClient.updateUserStatus(userId, status, reason);
      await loadUsers(); // Reload users to get updated status
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h1>User Management</h1>
      <UserList users={users} onStatusUpdate={updateUserStatus} />
      <CreateUserForm onSubmit={createUser} />
    </div>
  );
};
```

### Vue.js Component Example

```vue
<template>
  <div class="user-management">
    <h1>User Management</h1>
    
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    <div v-else>
      <user-list 
        :users="users" 
        @status-update="updateUserStatus"
      />
      <create-user-form @submit="createUser" />
    </div>
  </div>
</template>

<script>
import { ApiClient } from './api-client';
import UserList from './UserList.vue';
import CreateUserForm from './CreateUserForm.vue';

export default {
  name: 'UserManagement',
  components: {
    UserList,
    CreateUserForm
  },
  data() {
    return {
      users: [],
      loading: false,
      error: null,
      apiClient: new ApiClient('https://api.tradedocs.com')
    };
  },
  async mounted() {
    await this.loadUsers();
  },
  methods: {
    async loadUsers() {
      this.loading = true;
      this.error = null;
      
      try {
        this.users = await this.apiClient.searchUsers('account-id', {
          status: 'active',
          page: 1,
          limit: 20
        });
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    
    async createUser(userData) {
      try {
        const newUser = await this.apiClient.createUser({
          ...userData,
          inviterId: 'current-user-id',
          inviterName: 'Current User'
        });
        
        this.users.push(newUser);
        return newUser;
      } catch (err) {
        this.error = err.message;
        throw err;
      }
    },
    
    async updateUserStatus(userId, status, reason) {
      try {
        await this.apiClient.updateUserStatus(userId, status, reason);
        await this.loadUsers(); // Reload users to get updated status
      } catch (err) {
        this.error = err.message;
        throw err;
      }
    }
  }
};
</script>
```

## Conclusion

This integration guide provides comprehensive coverage of the Trade Documents Platform API for user management and authentication. Key points to remember:

1. **Always handle errors gracefully** and provide meaningful feedback to users
2. **Implement proper token management** with automatic refresh
3. **Validate data on both client and server side**
4. **Follow security best practices** for password and MFA handling
5. **Use the provided examples** as starting points for your implementation

For additional support or questions, please refer to the API documentation or contact the development team. 