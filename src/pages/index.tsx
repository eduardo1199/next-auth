import { useState, FormEvent, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { withSSRGuest } from "../utils/withSSRGuest";

function App() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const { isAuthenticated, signIn  } = useContext(AuthContext);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const data = {
      email,
      password
    }

    await signIn(data);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">Entrar</button>
    </form>
  )
}

export default App;

export const getServerSideProps = withSSRGuest(async (props) => {
  return {
    props: {
     users: [] 
    }
  }
});
