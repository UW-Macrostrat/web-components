import h from "@macrostrat/hyper";
import { useAPIActions, APIContext } from "@macrostrat/ui-components";
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  Dispatch,
} from "react";

type AnyUser = string | object;

type RequestForm = { type: "request-form"; enabled?: boolean };
type Credentials<T = AnyUser> = { user: T; password: string };
type LoginStatus<T = AnyUser> = {
  user: T;
  login: boolean;
  error: Error | null;
};

type UpdateStatus = {
  type: "update-status";
  payload: Partial<LoginStatus>;
};
type AuthSuccess = {
  type: "auth-form-success";
  payload: LoginStatus;
};

type AuthFailure = { type: "auth-form-failure"; payload: LoginStatus };

type AuthAction = RequestForm | UpdateStatus | AuthSuccess | AuthFailure;

type GetStatus = { type: "get-status" };
type Login<T = AnyUser> = { type: "login"; payload: Credentials<T> };
type Logout = { type: "logout" };

type AsyncAuthAction = GetStatus | Login | Logout;

type AuthDispatch = Dispatch<AuthAction>;

function useAuthActions(dispatch: AuthDispatch, context: APIContext) {
  const { get, post } = useAPIActions(context);
  return async (action: AuthAction | AsyncAuthAction) => {
    switch (action.type) {
      case "get-status":
        // Right now, we get login status from the
        // /auth/refresh endpoint, which refreshes access
        // tokens allowing us to extend our session.
        // It could be desirable for security (especially
        // when editing information becomes a factor) to
        // only refresh tokens when access is proactively
        // granted by the application.
        try {
          const { login, user } = await get("/auth/status");
          return dispatch({
            type: "update-status",
            payload: { login, user, error: null },
          });
        } catch (error) {
          return dispatch({ type: "update-status", payload: { error } });
        }
      case "login":
        try {
          const res = await post("/auth/login", action.payload);
          const { login, user } = res;
          return dispatch({
            type: "auth-form-success",
            payload: { user, login, error: null },
          });
        } catch (error) {
          return dispatch({
            type: "auth-form-failure",
            payload: { login: false, user: null, error },
          });
        }
      case "logout": {
        const { login } = await post("/auth/logout", {});
        return dispatch({
          type: "auth-form-success",
          payload: {
            login,
            user: null,
            error: null,
          },
        });
      }
      default:
        return dispatch(action);
    }
  };
}

interface AuthState<T extends AnyUser> {
  login: boolean;
  user: T | null;
  isLoggingIn: boolean;
  invalidAttempt: boolean;
  error: Error | null;
}

interface AuthCtx<T extends AnyUser> extends AuthState<T> {
  runAction(action: AuthAction | AsyncAuthAction): Promise<void>;
}

const authDefaultState: AuthState<AnyUser> = {
  login: false,
  user: null,
  isLoggingIn: false,
  invalidAttempt: false,
  error: null,
};

const AuthContext = createContext<AuthCtx>({
  ...authDefaultState,
  async runAction() {},
});

function authReducer(state = authDefaultState, action: AuthAction) {
  switch (action.type) {
    case "update-status": {
      return {
        ...state,
        ...action.payload,
      };
    }
    case "auth-form-success": {
      return {
        ...action.payload,
        isLoggingIn: false,
        invalidAttempt: false,
      };
    }
    case "auth-form-failure":
      return {
        ...state,
        ...action.payload,
        isLoggingIn: true,
        invalidAttempt: true,
      };
    case "request-form":
      return {
        ...state,
        isLoggingIn: action.enabled ?? true,
        invalidAttempt: false,
      };
    default:
      return state;
  }
}

interface AuthProviderProps<T = AnyUser> {
  context: APIContext;
  user: T;
  children: React.ReactNode;
}

function AuthProvider<T extends AnyUser>(props: AuthProviderProps<T>) {
  const { context, children, user } = props;
  const [state, dispatch] = useReducer(authReducer, authDefaultState);
  const runAction = useAuthActions(dispatch, context);
  useEffect(() => {
    if (user == null) return;
    runAction({ type: "get-status" });
  }, [user]);
  return h(
    AuthContext.Provider,
    { value: { ...state, user, runAction } },
    children
  );
}

const useAuth = () => useContext(AuthContext);

export { AuthContext, AuthProvider, useAuth };
