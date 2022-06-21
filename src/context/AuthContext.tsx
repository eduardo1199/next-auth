import { createContext, useEffect, useState } from "react";
import { api } from "../services/apiClient";
import { defaultToken } from "../services/api";
import { useRouter } from 'next/router';
import Router from 'next/router';
import { setCookie, parseCookies, destroyCookie } from 'nookies';

type signInCreation = {
  email: string;
  password: string;
}

type AuthContextData = {
  signIn: (credentials: signInCreation) => Promise<void>;
  signOut: () => void;
  postMessage: () => void;
  isAuthenticated: boolean;
  user: User;
};

type User = {
  email: string;
  permissions: string[];
  roles: string[];
}

type AuthProviderProps = {
  children: React.ReactNode
};

let authChannel: BroadcastChannel

export function SignOut() {
  destroyCookie(undefined, 'nextauth.token');
  destroyCookie(undefined, 'nextauth.refreshtoken');

  Router.push('/');
}

export function postMessageSingOut() {
  authChannel.postMessage('signOut');
}

export const AuthContext = createContext({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  
  const [user, setUser] = useState<User>({} as User);
  const isAuthenticated = !!user;

  useEffect(() => {
    authChannel = new BroadcastChannel('auth');

    authChannel.onmessage = (message) => {
      switch (message.data){
        case 'signOut': 
          SignOut();
          break;
        default:
          break;
      }
    }
  }, [])

  useEffect(() => {
    const { 'nextauth.token': token } = parseCookies();

    if(token) {
      api.get('/me').then((response) => {
        const { email, permissions, roles } = response.data;

        setUser({ email, permissions, roles  });
      }).catch(() => {
        destroyCookie(undefined, 'nextauth.token');
        destroyCookie(undefined, 'nextauth.refreshtoken');

        SignOut();
      });
    }
  }, []);
  
  async function signIn(credentials: signInCreation) {
    try {
      const response = await api.post('sessions', {
        ...credentials
      });

      const { token, refreshToken, permissions, roles } = response.data;

      setCookie(undefined, 'nextauth.token', token, {
        maxAge: 60 * 60 * 25 * 30, // 30 days
        path: '/'
      });

      setCookie(undefined, 'nextauth.refreshtoken', refreshToken, {
        maxAge: 60 * 60 * 25 * 30, // 30 days
        path: '/'
      });
  
      setUser({
        email: credentials.email,
        permissions,
        roles
      });

      defaultToken(token);

      router.push('/dashboard');
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <AuthContext.Provider value={{ signIn , isAuthenticated, user, signOut: SignOut, postMessage: postMessageSingOut }}>
      {children}
    </AuthContext.Provider>
  )
}
