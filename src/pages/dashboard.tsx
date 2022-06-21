import { useContext } from "react"
import { Can } from "../components/Can";
import { AuthContext } from "../context/AuthContext";
import { useCan } from "../hooks/useCan";
import { setupAPIClient } from "../services/api";
import { withSSRAuth } from "../utils/withSSRAuth";

export default function Dashboard() {
  const { user, signOut, postMessage } = useContext(AuthContext);

  return (
    <>
      <h1>hello word {user.email}</h1>
      
      <button onClick={() => {signOut(); postMessage()}}>Sair</button>

      <Can permissions={['metrics.list']}>
        <div>Metricas</div>
      </Can>
    </>
  )
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setupAPIClient(ctx);

  const response = await apiClient.get('/me');

  return {
    props: {
      
    }
  }
})