import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { destroyCookie, parseCookies } from "nookies";
import { AuthTokenError } from "../services/errors/AuthTokenError";
import decode from 'jwt-decode';
import { User, validateUserPermissions } from "./validateUserPermission";

interface WithSSRAuthOptions {
  permissions?: string[];
  roles?: string[];
}

export function withSSRAuth<P>(fn: GetServerSideProps<P>, options?: WithSSRAuthOptions) {
 return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {
  const cookies = parseCookies(ctx);
  const token = cookies['nextauth.token'];

  if(!cookies['nextauth.token']) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      }
    }
  }

  if(options) {
    const user = decode<User>(token);

    const userHasValidPermissions = validateUserPermissions({
      user,
      permissions: options?.permissions,
      roles: options?.roles
    });

    console.log(userHasValidPermissions);

    if(!userHasValidPermissions) {
      return {
        redirect: {
          destination: '/dashboard',
          permanent: false,
        }
      }
    }
  }

  try {
    return await fn(ctx);
  } catch (err) {
    if(err instanceof AuthTokenError) {
      destroyCookie(ctx,'nextauth.refreshtoken');
      destroyCookie(ctx,'nextauth.token');

      return {
        redirect: {
          destination: '/',
          permanent: false,
        }
      }
    } else {
      return {
        notFound: true,
      }
    }
  }
 }
}