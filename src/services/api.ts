import axios, { AxiosError } from 'axios';
import { GetServerSidePropsContext } from 'next';
import { parseCookies, setCookie } from 'nookies';
import { SignOut } from '../context/AuthContext';
import { AuthTokenError } from './errors/AuthTokenError';

let isRefresh = false;
let failedRequestQueue = [] as any[];

interface AxiosErrorResponse {
  code: string;
  error: boolean;
  message: string;
}

export function defaultToken (token: any) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export function setupAPIClient(ctx?: GetServerSidePropsContext) {
  let cookies = parseCookies(ctx);

  const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
      Authorization: `Bearer ${cookies['nextauth.token']}`
    },
  });

  api.interceptors.response.use(response => {
    return response;
  }, (error: AxiosError<AxiosErrorResponse>) => {
    if(error.response?.status === 401) {
      if(error.response.data?.code === 'token.expired') {
        cookies = parseCookies(ctx);
  
        const { 'nextauth.refreshtoken': refreshToken } =  cookies;
        const  originalConfig = error.config;
  
        if(!isRefresh) {
          isRefresh = true;
  
          api.post('/refresh', { refreshToken }).then((response) => {
            const { token, refreshToken } = response.data;
    
            setCookie(ctx, 'nextauth.token', token, {
              maxAge: 60 * 60 * 25 * 30, // 30 days
              path: '/'
            });
      
            setCookie(ctx, 'nextauth.refreshtoken', refreshToken , {
              maxAge: 60 * 60 * 25 * 30, // 30 days
              path: '/'
            });
    
            defaultToken(token);
  
            failedRequestQueue.forEach((request) => request.onSuccess(token));
          }).catch((error) => {
            failedRequestQueue.forEach((request) => request.reject(error));
            failedRequestQueue = [];
  
            if(process.browser) {
              SignOut();
            }
          }).finally(() => {
            isRefresh = false;
          });
        }
  
        return new Promise((resolve, reject) => {
          failedRequestQueue.push({
            onSuccess: (token: string) => {
              if(originalConfig.headers) {
                originalConfig.headers['Authorization'] = `Bearer ${token}`;
              }
  
              resolve(api(originalConfig));
            },
            reject: (err: AxiosError) => {
              reject(err);
            },
          })
        });
      } else {
        if(process.browser) {
          SignOut();
        } else {
          return Promise.reject(new AuthTokenError())
        }
      }
    }
  
    return Promise.reject(error);
  });
  
  return api;
}