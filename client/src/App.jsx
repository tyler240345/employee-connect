import { useState , useEffect} from 'react'
import './App.css'

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);

  const handleSubmit = async (e) => {
    
    e.preventDefault();

    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      credentials: 'include',
      headers: {'Content-Type': 'application/json' },
      body: JSON.stringify({username, password}),
    });

    const data = await response.json();

    if (!response.ok) {

      setMessage(data.error);
      return;

    }

    setUser(data);

  };

  useEffect(() => {
    fetch('http://localhost:3000/me', {
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) {
          return null;
        }
        return res.json();
      })

      .then((data) => {
        if (data) setUser(data);
      });
  }, []);

  if (user) {
    return (
      <div>
        <h1>Welcome, {user.full_name}</h1>
        <p>Username: {user.username}</p>
        <p>Role: {user.role}</p>
      </div>
    );
  }

  return (

    <div>
      <h1>Employee Connect - Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username: </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label>Password: </label>
          <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type='submit'>Log In</button>
        </form>
        {message && <p>{message}</p>}
    </div>
  );
}

export default App
