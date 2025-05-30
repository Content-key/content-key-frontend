import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 🌍 Confirm deployed API env + force rebuild
console.log("🌍 Deployed ENV:", process.env.REACT_APP_API_URL);
console.log("💥 Forced rebuild:", Date.now());

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async(e) => {
        e.preventDefault();

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            console.log('Login response:', data);

            if (!response.ok) {
                alert(data.message || 'Login failed');
                return;
            }

            localStorage.setItem('token', data.token);

            // Redirect based on role
            if (data.user.role === 'creator') {
                navigate('/dashboard/creator');
            } else if (data.user.role === 'sponsor') {
                navigate('/dashboard/sponsor');
            } else {
                navigate('/profile');
            }
        } catch (err) {
            console.error('Login error:', err);
            alert('Something went wrong');
        }
    };

    return ( <
        div className = "login-container"
        style = { containerStyle } >
        <
        h2 > Login < /h2> <
        form onSubmit = { handleLogin } >
        <
        input type = "email"
        placeholder = "Email"
        value = { email }
        onChange = {
            (e) => setEmail(e.target.value) }
        required style = { inputStyle }
        /> <
        input type = "password"
        placeholder = "Password"
        value = { password }
        onChange = {
            (e) => setPassword(e.target.value) }
        required style = { inputStyle }
        /> <
        button type = "submit"
        style = { buttonStyle } > Log In < /button> <
        /form> <
        /div>
    );
}

const containerStyle = {
    backgroundColor: '#ffeb3b',
    color: '#1a1a1a',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'sans-serif',
};

const inputStyle = {
    display: 'block',
    width: '100%',
    maxWidth: '300px',
    padding: '10px',
    marginBottom: '15px',
    border: '1px solid #ccc',
    borderRadius: '4px',
};

const buttonStyle = {
    backgroundColor: '#000',
    color: '#ffeb3b',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
};

export default Login;